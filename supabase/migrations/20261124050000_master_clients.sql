-- JFRESH OS · Master Data: clients and their properties (mode asli)
--
-- A client is the company J'Fresh bills (e.g. "Jaens Spa Group").
-- A property is one place J'Fresh picks up from and delivers to (e.g. "Jaens
-- Spa Ubud"); one client can have many. Neither is ever deleted: orders and
-- invoices will point to them, so they are switched to inactive instead.
--
-- Staff read everything; a client portal account reads only its own client.
-- Writing needs the master-data permission (sys.master).

alter table public.clients
  add column legal_name          text,
  add column client_type         text not null default 'hotel'
    check (client_type in ('hotel', 'resort', 'villa', 'spa', 'fnb', 'personal', 'other')),
  add column tax_id              text,
  add column billing_address     text,
  add column city                text,
  add column contact_name        text,
  add column contact_phone       text,
  add column contact_email       text,
  add column payment_terms_days  integer not null default 30 check (payment_terms_days between 0 and 180),
  add column notes               text,
  add column created_by          uuid references auth.users (id) default auth.uid();

alter table public.clients drop constraint if exists clients_status_check;
alter table public.clients add constraint clients_status_check
  check (status in ('prospect', 'active', 'onhold', 'inactive'));

-- New client codes: CL-01, CL-02, ... (the app suggests the next one).
create table public.properties (
  id                 text primary key,                      -- PR-01A
  client_id          text not null references public.clients (id),
  name               text not null,
  property_type      text not null default 'hotel'
    check (property_type in ('hotel', 'resort', 'villa', 'spa', 'fnb', 'personal', 'other')),
  address            text,
  city               text,
  plant_id           text references public.plants (id),   -- plant that serves it
  contact_name       text,
  contact_phone      text,
  pickup_schedule    text,
  delivery_schedule  text,
  instructions       text,
  status             text not null default 'active' check (status in ('active', 'inactive')),
  created_by         uuid references auth.users (id) default auth.uid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index properties_client_idx on public.properties (client_id);
create trigger properties_touch before update on public.properties for each row execute function public.touch_updated_at();

alter table public.properties enable row level security;
create policy properties_read on public.properties for select to authenticated
  using (public.is_staff() or client_id = public.my_client_id());
create policy properties_write on public.properties for all to authenticated
  using (public.has_perm('sys.master')) with check (public.has_perm('sys.master'));

revoke all on public.properties from anon;
-- Never deleted: switched to inactive instead.
revoke delete on public.properties, public.clients from authenticated;
grant select, insert, update on public.properties to authenticated;
