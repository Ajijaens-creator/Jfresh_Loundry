-- =============================================================================
-- JFRESH OS · Backend step 1 · Access foundation
--
-- Moves the Phase 4 access model (assets/js/jfos-access.js) to the database:
-- plants, clients, employees, user accounts (profiles linked to Supabase Auth),
-- roles, permissions, plant scope, per-user denies and the audit trail.
--
-- Rules carried over from the prototype:
--   * Employee and user account are separate records (§10).
--   * Role = experience, permission = actions (§11). A user may hold several
--     roles, exactly one of them the default.
--   * A user acts only while the account is active and not locked; a user
--     with no role has no permission ("dewa" case).
--   * Hidden menus are never the security boundary: every table has row level
--     security and every rule below is enforced by the database itself.
--
-- Reference data (plants, roles, permissions) is loaded by the next migration,
-- which tools/export-access-seed.js generates from the JS engines.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.plants (
  id          text primary key,                       -- PL-01
  name        text not null,
  short_name  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.clients (
  id          text primary key,                       -- CL-01
  name        text not null,
  plant_id    text references public.plants (id),
  status      text not null default 'active' check (status in ('active', 'inactive')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.employees (
  id          text primary key,                       -- EMP-001
  full_name   text not null,
  short_name  text,
  department  text,
  status      text not null default 'active' check (status in ('active', 'inactive', 'resigned')),
  vehicle     text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.roles (
  key            text primary key,                    -- operator, owner, ...
  name_id        text not null,
  name_en        text not null,
  experience     text not null,                       -- navigation shell / home the role uses
  role_group     text not null check (role_group in ('frontline', 'management', 'client')),
  landing_screen text,
  landing_code   text,
  is_custom      boolean not null default false,
  cloned_from    text references public.roles (key),
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table public.permissions (
  key         text primary key,                       -- ops.receive, sys.users, ...
  module      text generated always as (split_part(key, '.', 1)) stored,
  created_at  timestamptz not null default now()
);

create table public.role_permissions (
  role_key        text not null references public.roles (key) on delete cascade,
  permission_key  text not null references public.permissions (key) on delete cascade,
  primary key (role_key, permission_key)
);

-- One row per login account. id = auth.users.id.
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  legacy_id        text unique,                       -- USR-001 from the prototype
  username         text unique,
  email            text,
  display_name     text,
  employee_id      text unique references public.employees (id),
  client_id        text references public.clients (id),
  status           text not null default 'active'
                   check (status in ('active', 'inactive', 'locked', 'suspended')),
  locked_until     timestamptz,
  lang             text not null default 'id' check (lang in ('id', 'en')),
  full_access      boolean not null default false,    -- owner-level: every permission
  all_plants       boolean not null default false,
  default_plant_id text references public.plants (id),
  can_switch_role  boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint profiles_staff_or_client check (employee_id is null or client_id is null)
);

create table public.user_roles (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  role_key    text not null references public.roles (key),
  is_default  boolean not null default false,
  granted_at  timestamptz not null default now(),
  granted_by  uuid references public.profiles (id),
  primary key (user_id, role_key)
);
create unique index user_roles_one_default on public.user_roles (user_id) where is_default;

create table public.user_plants (
  user_id   uuid not null references public.profiles (id) on delete cascade,
  plant_id  text not null references public.plants (id),
  primary key (user_id, plant_id)
);

-- Per-user exceptions: a permission the user's roles grant but this user must not use.
create table public.user_permission_denies (
  user_id         uuid not null references public.profiles (id) on delete cascade,
  permission_key  text not null references public.permissions (key) on delete cascade,
  primary key (user_id, permission_key)
);

-- Append-only security audit trail.
create table public.audit_log (
  id       bigint generated always as identity primary key,
  at       timestamptz not null default now(),
  actor    uuid references public.profiles (id) on delete set null,
  event    text not null,                             -- AUTH.LOGIN_OK, USER.ROLE_GRANT, ...
  target   text,
  details  jsonb not null default '{}'::jsonb
);
create index audit_log_at on public.audit_log (at desc);
create index audit_log_actor on public.audit_log (actor);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger clients_touch   before update on public.clients   for each row execute function public.touch_updated_at();
create trigger employees_touch before update on public.employees for each row execute function public.touch_updated_at();
create trigger profiles_touch  before update on public.profiles  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Access helpers. SECURITY DEFINER so RLS policies can call them without
-- recursing into the policies of the tables they read.
-- ---------------------------------------------------------------------------

-- The caller's account is active and not locked.
create function public.is_active_user() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.status = 'active'
      and (p.locked_until is null or p.locked_until <= now())
  );
$$;

create function public.is_full_access() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_user() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.full_access
  );
$$;

-- Effective permissions of the caller: union of role permissions, minus denies.
create function public.my_permissions() returns setof text
language sql stable security definer set search_path = '' as $$
  select perm.key
  from public.permissions perm
  where public.is_active_user()
    and not exists (select 1 from public.user_permission_denies d
                    where d.user_id = auth.uid() and d.permission_key = perm.key)
    and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.full_access)
      or exists (select 1
                 from public.user_roles ur
                 join public.roles r on r.key = ur.role_key and r.active
                 join public.role_permissions rp on rp.role_key = ur.role_key
                 where ur.user_id = auth.uid() and rp.permission_key = perm.key)
    );
$$;

create function public.has_perm(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.my_permissions() k where k = p_key);
$$;

-- Plants the caller may work in.
create function public.my_plants() returns setof text
language sql stable security definer set search_path = '' as $$
  select pl.id from public.plants pl
  where public.is_active_user()
    and (
      exists (select 1 from public.profiles p where p.id = auth.uid() and (p.all_plants or p.full_access))
      or exists (select 1 from public.user_plants up where up.user_id = auth.uid() and up.plant_id = pl.id)
    );
$$;

create function public.my_client_id() returns text
language sql stable security definer set search_path = '' as $$
  select p.client_id from public.profiles p
  where p.id = auth.uid() and public.is_active_user();
$$;

-- Staff = an active account that is not a client portal account.
create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_active_user() and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.client_id is null
  );
$$;

-- Everything the app needs after login, in one call.
create function public.my_access() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when p.id is null then null else jsonb_build_object(
    'user_id',        p.id,
    'legacy_id',      p.legacy_id,
    'username',       p.username,
    'display_name',   coalesce(p.display_name, e.full_name, p.email),
    'status',         p.status,
    'locked_until',   p.locked_until,
    'active',         public.is_active_user(),
    'lang',           p.lang,
    'employee_id',    p.employee_id,
    'client_id',      p.client_id,
    'full_access',    p.full_access,
    'can_switch_role', p.can_switch_role,
    'default_plant',  p.default_plant_id,
    'plants',         coalesce((select jsonb_agg(x order by x) from public.my_plants() x), '[]'::jsonb),
    'roles',          coalesce((select jsonb_agg(jsonb_build_object(
                                  'key', r.key, 'default', ur.is_default,
                                  'experience', r.experience, 'group', r.role_group,
                                  'landing', r.landing_screen)
                                  order by ur.is_default desc, r.key)
                                from public.user_roles ur join public.roles r on r.key = ur.role_key and r.active
                                where ur.user_id = p.id), '[]'::jsonb),
    'permissions',    coalesce((select jsonb_agg(k order by k) from public.my_permissions() k), '[]'::jsonb)
  ) end
  from (select auth.uid() as uid) me
  left join public.profiles p on p.id = me.uid
  left join public.employees e on e.id = p.employee_id;
$$;

-- Audit: the only way to write the trail. The actor is always the caller.
create function public.log_event(p_event text, p_target text default null, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  if p_event is null or length(p_event) > 80 then
    raise exception 'invalid event';
  end if;
  insert into public.audit_log (actor, event, target, details)
  values (auth.uid(), p_event, left(p_target, 200), coalesce(p_details, '{}'::jsonb));
end $$;

-- ---------------------------------------------------------------------------
-- New Supabase Auth user → profile. A new account starts with no role, so it
-- can sign in but do nothing until an admin grants a role.
-- ---------------------------------------------------------------------------

create function public.handle_new_auth_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Escalation guards. Admins with sys.users manage accounts, but:
--   * only a full-access user may grant full access, all plants, or the
--     owner / superadmin roles, or change a full-access account;
--   * nobody changes their own roles, denies, status or full access.
-- Statements run from the SQL editor or migrations (no auth.uid()) are trusted.
-- ---------------------------------------------------------------------------

create function public.guard_profile_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  if new.id = auth.uid() and (
       new.status is distinct from old.status
    or new.locked_until is distinct from old.locked_until
    or new.full_access is distinct from old.full_access
    or new.all_plants is distinct from old.all_plants
    or new.employee_id is distinct from old.employee_id
    or new.client_id is distinct from old.client_id) then
    raise exception 'you cannot change your own access';
  end if;
  if (old.full_access or new.full_access is distinct from old.full_access or (new.all_plants and not old.all_plants))
     and not public.is_full_access() then
    raise exception 'only a full-access user can change a full-access account, full access or all plants';
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_change();

create function public.guard_user_role_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  r := coalesce(new, old);
  if r.user_id = auth.uid() then
    raise exception 'you cannot change your own roles';
  end if;
  if (r.role_key in ('owner', 'superadmin')
      or exists (select 1 from public.profiles p where p.id = r.user_id and p.full_access))
     and not public.is_full_access() then
    raise exception 'only a full-access user can grant or remove this role';
  end if;
  if tg_op = 'INSERT' then new.granted_by := auth.uid(); end if;
  return coalesce(new, old);
end $$;

create trigger user_roles_guard before insert or update or delete on public.user_roles
  for each row execute function public.guard_user_role_change();

create function public.guard_self_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and coalesce(new.user_id, old.user_id) = auth.uid() then
    raise exception 'you cannot change your own access';
  end if;
  return coalesce(new, old);
end $$;

create trigger user_plants_guard before insert or update or delete on public.user_plants
  for each row execute function public.guard_self_change();
create trigger user_denies_guard before insert or update or delete on public.user_permission_denies
  for each row execute function public.guard_self_change();

-- Signed-in users may change only their own language.
create function public.set_my_language(p_lang text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if p_lang not in ('id', 'en') then raise exception 'invalid language'; end if;
  update public.profiles set lang = p_lang where id = auth.uid();
end $$;

-- One-time setup: make an existing Auth user the owner with full access.
-- Not callable from the app; run it once in the Supabase SQL editor.
create function public.bootstrap_owner(p_email text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where lower(email) = lower(p_email);
  if v_id is null then raise exception 'no auth user with email %', p_email; end if;
  insert into public.profiles (id, email) values (v_id, p_email) on conflict (id) do nothing;
  update public.profiles
     set full_access = true, all_plants = true, status = 'active', locked_until = null
   where id = v_id;
  update public.user_roles set is_default = false where user_id = v_id;
  insert into public.user_roles (user_id, role_key, is_default) values (v_id, 'owner', true)
  on conflict (user_id, role_key) do update set is_default = true;
  insert into public.audit_log (actor, event, target) values (v_id, 'SETUP.BOOTSTRAP_OWNER', p_email);
  return v_id;
end $$;

-- ---------------------------------------------------------------------------
-- Privileges. Nothing is readable without signing in.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on function
  public.is_active_user(), public.is_full_access(), public.my_permissions(), public.has_perm(text),
  public.my_plants(), public.my_client_id(), public.is_staff(), public.my_access(),
  public.log_event(text, text, jsonb), public.set_my_language(text)
  to authenticated;
revoke execute on function public.bootstrap_owner(text) from authenticated;

revoke insert, update, delete on public.audit_log from authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.plants                 enable row level security;
alter table public.clients                enable row level security;
alter table public.employees              enable row level security;
alter table public.roles                  enable row level security;
alter table public.permissions            enable row level security;
alter table public.role_permissions       enable row level security;
alter table public.profiles               enable row level security;
alter table public.user_roles             enable row level security;
alter table public.user_plants            enable row level security;
alter table public.user_permission_denies enable row level security;
alter table public.audit_log              enable row level security;

-- Plants: staff read; master-data admins write.
create policy plants_read  on public.plants for select to authenticated using (public.is_staff());
create policy plants_write on public.plants for all    to authenticated
  using (public.has_perm('sys.master')) with check (public.has_perm('sys.master'));

-- Clients: staff read all; a client portal user reads only their own client.
create policy clients_read on public.clients for select to authenticated
  using (public.is_staff() or id = public.my_client_id());
create policy clients_write on public.clients for all to authenticated
  using (public.has_perm('sys.master')) with check (public.has_perm('sys.master'));

-- Employees: user admins read and write; everyone reads their own record.
create policy employees_read on public.employees for select to authenticated
  using (public.has_perm('sys.users')
         or id = (select p.employee_id from public.profiles p where p.id = auth.uid()));
create policy employees_write on public.employees for all to authenticated
  using (public.has_perm('sys.users')) with check (public.has_perm('sys.users'));

-- Role catalogue: any active user reads; role admins write.
create policy roles_read on public.roles for select to authenticated using (public.is_active_user());
create policy roles_write on public.roles for all to authenticated
  using (public.has_perm('sys.roles')) with check (public.has_perm('sys.roles'));
create policy permissions_read on public.permissions for select to authenticated using (public.is_active_user());
create policy permissions_write on public.permissions for all to authenticated
  using (public.has_perm('sys.roles')) with check (public.has_perm('sys.roles'));
create policy role_permissions_read on public.role_permissions for select to authenticated using (public.is_active_user());
create policy role_permissions_write on public.role_permissions for all to authenticated
  using (public.has_perm('sys.roles')) with check (public.has_perm('sys.roles'));

-- Accounts: everyone reads their own; user admins read and manage all.
-- New accounts are created through Supabase Auth (trigger above), not inserted here.
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_perm('sys.users'));
create policy profiles_update on public.profiles for update to authenticated
  using (public.has_perm('sys.users')) with check (public.has_perm('sys.users'));

create policy user_roles_read on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_perm('sys.users'));
create policy user_roles_write on public.user_roles for all to authenticated
  using (public.has_perm('sys.users')) with check (public.has_perm('sys.users'));

create policy user_plants_read on public.user_plants for select to authenticated
  using (user_id = auth.uid() or public.has_perm('sys.users'));
create policy user_plants_write on public.user_plants for all to authenticated
  using (public.has_perm('sys.users')) with check (public.has_perm('sys.users'));

create policy user_denies_read on public.user_permission_denies for select to authenticated
  using (user_id = auth.uid() or public.has_perm('sys.users'));
create policy user_denies_write on public.user_permission_denies for all to authenticated
  using (public.has_perm('sys.users')) with check (public.has_perm('sys.users'));

-- Audit trail: read with sys.audit; written only through log_event().
create policy audit_read on public.audit_log for select to authenticated
  using (public.has_perm('sys.audit'));
