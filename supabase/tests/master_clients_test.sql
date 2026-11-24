-- JFRESH OS · master data checks (migration 20261124050000).
-- A super admin (sys.master) adds a client and its properties; other staff
-- only read; nobody deletes; the client portal sees only its own client.
\set ON_ERROR_STOP 1
begin;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'super@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'operator@test.local');
select public.bootstrap_owner('owner@test.local');
insert into public.user_roles (user_id, role_key, is_default) values
  ('00000000-0000-0000-0000-000000000002', 'superadmin', true),
  ('00000000-0000-0000-0000-000000000004', 'operator', true);
insert into public.user_plants values ('00000000-0000-0000-0000-000000000004', 'PL-01');

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

set local role authenticated;

-- Super admin adds a client and two properties.
select pg_temp.as_user(2);
insert into public.clients (id, name, legal_name, client_type, city, plant_id, payment_terms_days, status)
values ('CL-01', 'Jaens Spa Group', 'PT Jaens Spa Indonesia', 'spa', 'Ubud', 'PL-01', 30, 'active');
insert into public.properties (id, client_id, name, property_type, city, plant_id) values
  ('PR-01A', 'CL-01', 'Jaens Spa Ubud', 'spa', 'Ubud', 'PL-01'),
  ('PR-01B', 'CL-01', 'Jaens Spa Seminyak', 'spa', 'Seminyak', 'PL-01');
select pg_temp.ok((select created_by = '00000000-0000-0000-0000-000000000002' from public.properties where id = 'PR-01A'), 'created_by recorded');
update public.clients set status = 'onhold', notes = 'negosiasi' where id = 'CL-01';
select pg_temp.ok((select status = 'onhold' from public.clients where id = 'CL-01'), 'super admin updates a client');
update public.properties set status = 'inactive' where id = 'PR-01B';
select pg_temp.ok((select status = 'inactive' from public.properties where id = 'PR-01B'), 'super admin deactivates a property');
select pg_temp.fails($$delete from public.properties where id = 'PR-01B'$$, 'nobody deletes a property');
select pg_temp.fails($$delete from public.clients where id = 'CL-01'$$, 'nobody deletes a client');
select pg_temp.fails($$update public.clients set status = 'gone' where id = 'CL-01'$$, 'status must be a known value');
select pg_temp.fails($$insert into public.properties (id, client_id, name) values ('PR-X', 'CL-99', 'X')$$, 'property needs an existing client');

-- An operator reads but does not write.
select pg_temp.as_user(4);
select pg_temp.ok((select count(*) = 2 from public.properties), 'operator reads properties');
select pg_temp.fails($$insert into public.clients (id, name) values ('CL-02', 'X')$$, 'operator cannot add clients');
update public.properties set name = 'X' where id = 'PR-01A';
select pg_temp.ok((select name = 'Jaens Spa Ubud' from public.properties where id = 'PR-01A'), 'operator cannot change properties (row unchanged)');

-- Anonymous visitors see nothing.
reset role;
set local role anon;
select pg_temp.fails($$select count(*) from public.properties$$, 'anon cannot read properties');

rollback;
