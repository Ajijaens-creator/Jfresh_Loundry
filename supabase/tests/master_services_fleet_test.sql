-- JFRESH OS · services, contract prices and vehicles (migration 20261124060000).
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
select pg_temp.as_user(2);
insert into public.clients (id, name) values ('CL-01', 'Hotel Uji');
insert into public.services (id, name, unit, base_price, sla_hours) values ('SV-001', 'Wash Regular', 'kg', 7500, 24);
insert into public.client_rates (client_id, service_id, price) values ('CL-01', 'SV-001', 7000);
select pg_temp.ok((select price = 7000 from public.client_rates where client_id = 'CL-01'), 'contract price stored apart from the list price');
insert into public.client_rates (client_id, service_id, price) values ('CL-01', 'SV-001', 6800)
  on conflict (client_id, service_id) do update set price = excluded.price;
select pg_temp.ok((select price = 6800 from public.client_rates where client_id = 'CL-01'), 'contract price updated by upsert');
select pg_temp.fails($$insert into public.services (id, name, unit, base_price) values ('SV-002', 'X', 'liter', 1)$$, 'unit must be known');
select pg_temp.fails($$insert into public.services (id, name, base_price) values ('SV-003', 'X', -1)$$, 'price cannot be negative');
insert into public.employees (id, full_name, plant_id) values ('EMP-DRV', 'Ketut Driver', 'PL-01');
insert into public.vehicles (id, plate, vehicle_type, capacity_kg, plant_id, driver_employee_id) values ('JF-01', 'DK 1234 AB', 'van', 400, 'PL-01', 'EMP-DRV');
select pg_temp.fails($$insert into public.vehicles (id, plate) values ('JF-02', 'DK 1234 AB')$$, 'plate is unique');
update public.vehicles set status = 'repair' where id = 'JF-01';
select pg_temp.ok((select status = 'repair' from public.vehicles where id = 'JF-01'), 'vehicle status changes');
select pg_temp.fails($$delete from public.services where id = 'SV-001'$$, 'nobody deletes a service');
select pg_temp.fails($$delete from public.vehicles where id = 'JF-01'$$, 'nobody deletes a vehicle');

select pg_temp.as_user(4);
select pg_temp.ok((select count(*) = 1 from public.services) and (select count(*) = 1 from public.vehicles), 'operator reads services and vehicles');
select pg_temp.fails($$insert into public.services (id, name) values ('SV-009', 'X')$$, 'operator cannot add services');
update public.client_rates set price = 1 where client_id = 'CL-01';
select pg_temp.ok((select price = 6800 from public.client_rates where client_id = 'CL-01'), 'operator cannot change prices (row unchanged)');

reset role;
set local role anon;
select pg_temp.fails($$select count(*) from public.client_rates$$, 'anon cannot read prices');

rollback;
