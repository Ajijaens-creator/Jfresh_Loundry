-- JFRESH OS · access foundation checks.
-- Runs against a database that has the migrations applied (local Supabase or
-- plain Postgres with an auth stub). Every check raises on failure.
-- Users are created directly in auth.users; the trigger creates their profile.

\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'admin@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'operator@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'client@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'norole@test.local'),
  ('00000000-0000-0000-0000-000000000006', 'locked@test.local'),
  ('00000000-0000-0000-0000-000000000007', 'finance@test.local');

select public.bootstrap_owner('owner@test.local');
insert into public.clients (id, name, plant_id) values ('CL-01', 'Grand Vista', 'PL-01'), ('CL-02', 'Hotel ABC', 'PL-01');
insert into public.employees (id, full_name) values ('EMP-001', 'Made Wirana');
update public.profiles set employee_id = 'EMP-001' where email = 'operator@test.local';
update public.profiles set client_id = 'CL-01' where email = 'client@test.local';
update public.profiles set status = 'locked', locked_until = now() + interval '1 hour' where email = 'locked@test.local';
insert into public.user_roles (user_id, role_key, is_default) values
  ('00000000-0000-0000-0000-000000000002', 'sysadmin', true),
  ('00000000-0000-0000-0000-000000000003', 'operator', true),
  ('00000000-0000-0000-0000-000000000004', 'client', true),
  ('00000000-0000-0000-0000-000000000006', 'operator', true),
  ('00000000-0000-0000-0000-000000000007', 'finance', true);
insert into public.user_plants values ('00000000-0000-0000-0000-000000000003', 'PL-01');
insert into public.user_permission_denies values ('00000000-0000-0000-0000-000000000007', 'fin.invoice.fix.approve');

create function pg_temp.as_user(n int) returns void language sql as $$
  select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000' || n, true);
$$;
create function pg_temp.ok(c boolean, msg text) returns void language plpgsql as $$
begin if not coalesce(c, false) then raise exception 'FAIL: %', msg; end if; raise notice 'PASS: %', msg; end $$;
create function pg_temp.fails(sql text, msg text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'PASS: % (%)', msg, sqlerrm; return; end;
  raise exception 'FAIL: % (statement succeeded)', msg;
end $$;
grant execute on all functions in schema pg_temp to authenticated, anon;

-- anonymous: nothing
set local role anon;
select pg_temp.fails('select * from public.plants', 'anon cannot read plants');
select pg_temp.fails('select public.my_access()', 'anon cannot call my_access');
reset role;

set local role authenticated;

-- owner
select pg_temp.as_user(1);
select pg_temp.ok((public.my_access() ->> 'full_access')::boolean, 'owner has full access');
select pg_temp.ok(public.has_perm('sys.users') and public.has_perm('fin.invoice.fix.approve'), 'owner has every permission');
select pg_temp.ok((select count(*) from public.my_plants()) = 2, 'owner sees all plants');
select pg_temp.ok((select count(*) from public.profiles) = 7, 'owner reads all accounts');
select pg_temp.fails($$delete from public.user_roles where user_id = auth.uid()$$, 'owner cannot change own roles');

-- operator
select pg_temp.as_user(3);
select pg_temp.ok(public.has_perm('home.op') and not public.has_perm('sys.users'), 'operator has operator perms only');
select pg_temp.ok((select array_agg(x) from public.my_plants() x) = array['PL-01'], 'operator scoped to PL-01');
select pg_temp.ok((select count(*) from public.profiles) = 1, 'operator reads only own account');
select pg_temp.ok((select count(*) from public.employees) = 1, 'operator reads own employee record');
select pg_temp.ok((select count(*) from public.clients) = 2, 'staff read clients');
select pg_temp.ok((select count(*) from public.audit_log) = 0, 'operator cannot read audit');
with u as (update public.profiles set status = 'suspended' where id = '00000000-0000-0000-0000-000000000005' returning 1)
select pg_temp.ok((select count(*) from u) = 0, 'operator cannot update other accounts');
select pg_temp.fails($$insert into public.user_roles values (auth.uid(), 'owner', false)$$, 'operator cannot grant self owner');
select pg_temp.fails($$insert into public.audit_log (event) values ('FAKE')$$, 'audit not writable directly');
select public.log_event('AUTH.LOGIN_OK', 'test');
select public.set_my_language('en');
select pg_temp.ok((select lang from public.profiles where id = auth.uid()) = 'en', 'user sets own language');

-- client portal user
select pg_temp.as_user(4);
select pg_temp.ok((select array_agg(id) from public.clients) = array['CL-01'], 'client sees only own client');
select pg_temp.ok((select count(*) from public.plants) = 0, 'client cannot read plants');

-- no role
select pg_temp.as_user(5);
select pg_temp.ok((select count(*) from public.my_permissions()) = 0, 'user without role has no permission');

-- locked
select pg_temp.as_user(6);
select pg_temp.ok(not public.is_active_user() and (select count(*) from public.my_permissions()) = 0, 'locked user has no permission');
select pg_temp.ok((select count(*) from public.roles) = 0, 'locked user reads nothing');

-- per-user deny
select pg_temp.as_user(7);
select pg_temp.ok(public.has_perm('home.fin') or (select count(*) from public.my_permissions()) > 0, 'finance has permissions');
select pg_temp.ok(not public.has_perm('fin.invoice.fix.approve'), 'deny removes a role permission');

-- system admin (sys.users) but not full access
select pg_temp.as_user(2);
select pg_temp.ok(public.has_perm('sys.users'), 'sysadmin has sys.users');
select pg_temp.ok((select count(*) from public.profiles) = 7, 'sysadmin reads all accounts');
insert into public.user_roles values ('00000000-0000-0000-0000-000000000005', 'driver', true);
select pg_temp.ok(exists (select 1 from public.user_roles where user_id = '00000000-0000-0000-0000-000000000005' and granted_by = auth.uid()), 'sysadmin grants a role, granted_by recorded');
select pg_temp.fails($$insert into public.user_roles values ('00000000-0000-0000-0000-000000000005', 'owner', false)$$, 'sysadmin cannot grant owner');
select pg_temp.fails($$update public.profiles set full_access = true where id = '00000000-0000-0000-0000-000000000005'$$, 'sysadmin cannot grant full access');
select pg_temp.fails($$update public.profiles set status = 'suspended' where id = '00000000-0000-0000-0000-000000000001'$$, 'sysadmin cannot suspend the owner');
select pg_temp.fails($$delete from public.user_roles where user_id = '00000000-0000-0000-0000-000000000001'$$, 'sysadmin cannot remove owner roles');
select pg_temp.fails($$update public.profiles set status = 'inactive' where id = auth.uid()$$, 'sysadmin cannot change own status');
select pg_temp.ok((select count(*) from public.audit_log) >= 2, 'sysadmin reads audit');

reset role;
rollback;
\echo 'all access checks passed'
