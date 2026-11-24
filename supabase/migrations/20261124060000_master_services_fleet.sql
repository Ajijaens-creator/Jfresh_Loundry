-- JFRESH OS · Master Data: services & prices, vehicles (mode asli)
--
-- services       the J'Fresh service catalog with its standard (list) price.
-- client_rates   the contract price a client pays for a service. The list
--                price is never the contract price: billing uses the client
--                rate when there is one.
-- vehicles       pickup / delivery vehicles, the plant they belong to and
--                their usual driver (an employee).
--
-- Staff read; master-data admins (sys.master) write; nothing is deleted,
-- rows are switched off instead.

create table public.services (
  id           text primary key,                                -- SV-001
  name         text not null,
  description  text,
  unit         text not null default 'kg' check (unit in ('kg', 'pcs', 'set', 'm2')),
  base_price   numeric(12, 0) not null default 0 check (base_price >= 0),   -- rupiah per unit
  sla_hours    integer check (sla_hours between 1 and 720),
  active       boolean not null default true,
  created_by   uuid references auth.users (id) default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger services_touch before update on public.services for each row execute function public.touch_updated_at();

create table public.client_rates (
  client_id    text not null references public.clients (id),
  service_id   text not null references public.services (id),
  price        numeric(12, 0) not null check (price >= 0),
  active       boolean not null default true,
  updated_by   uuid references auth.users (id) default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (client_id, service_id)
);
create trigger client_rates_touch before update on public.client_rates for each row execute function public.touch_updated_at();

create table public.vehicles (
  id                  text primary key,                          -- JF-01
  plate               text not null unique,
  vehicle_type        text not null default 'van' check (vehicle_type in ('van', 'pickup', 'motor', 'truck', 'other')),
  capacity_kg         integer check (capacity_kg between 1 and 20000),
  plant_id            text references public.plants (id),
  driver_employee_id  text references public.employees (id),
  status              text not null default 'active' check (status in ('active', 'repair', 'inactive')),
  notes               text,
  created_by          uuid references auth.users (id) default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create trigger vehicles_touch before update on public.vehicles for each row execute function public.touch_updated_at();

alter table public.services     enable row level security;
alter table public.client_rates enable row level security;
alter table public.vehicles     enable row level security;

create policy services_read on public.services for select to authenticated using (public.is_staff());
create policy services_write on public.services for all to authenticated
  using (public.has_perm('sys.master')) with check (public.has_perm('sys.master'));

-- A client portal account may read its own contract prices.
create policy client_rates_read on public.client_rates for select to authenticated
  using (public.is_staff() or client_id = public.my_client_id());
create policy client_rates_write on public.client_rates for all to authenticated
  using (public.has_perm('sys.master')) with check (public.has_perm('sys.master'));

create policy vehicles_read on public.vehicles for select to authenticated using (public.is_staff());
create policy vehicles_write on public.vehicles for all to authenticated
  using (public.has_perm('sys.master')) with check (public.has_perm('sys.master'));

revoke all on public.services, public.client_rates, public.vehicles from anon;
revoke delete on public.services, public.client_rates, public.vehicles from authenticated;
grant select, insert, update on public.services, public.client_rates, public.vehicles to authenticated;
