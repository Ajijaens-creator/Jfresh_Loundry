-- =============================================================================
-- JFRESH OS · Backend step 2 · Real login on jfreshlaundry.app (mode asli)
--
-- my_access() now also returns the account email, all_plants and the employee
-- department, so the app can build the signed-in user without extra reads.
-- Team accounts are created by the admin-users Edge Function (service role
-- creates the Auth user; roles, plants and the employee record are written
-- with the caller's own token, so every guard and policy below still applies).
-- =============================================================================

create or replace function public.my_access() returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when p.id is null then null else jsonb_build_object(
    'user_id',        p.id,
    'legacy_id',      p.legacy_id,
    'username',       p.username,
    'email',          p.email,
    'display_name',   coalesce(p.display_name, e.full_name, p.email),
    'status',         p.status,
    'locked_until',   p.locked_until,
    'active',         public.is_active_user(),
    'lang',           p.lang,
    'employee_id',    p.employee_id,
    'department',     e.department,
    'client_id',      p.client_id,
    'full_access',    p.full_access,
    'all_plants',     p.all_plants,
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

-- Staff need the plant list for the plant switcher (already readable by staff
-- through plants_read). Nothing else changes.

-- ---------------------------------------------------------------------------
-- New staff flow: HR registers the employee → "menunggu akses" → an admin with
-- sys.users creates the login account and ticks the roles. An admin can also
-- do both in one go.
-- ---------------------------------------------------------------------------

alter table public.employees
  add column if not exists email      text,
  add column if not exists job_title  text,
  add column if not exists plant_id   text references public.plants (id),
  add column if not exists note       text,
  add column if not exists created_by uuid references public.profiles (id) on delete set null default auth.uid();
alter table public.employees
  alter column id set default ('EMP-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)));

-- HR (hr.manage) reads and writes employee records too. Deleting stays with user admins.
drop policy if exists employees_read  on public.employees;
drop policy if exists employees_write on public.employees;
create policy employees_read on public.employees for select to authenticated
  using (public.has_perm('sys.users') or public.has_perm('hr.manage')
         or id = (select p.employee_id from public.profiles p where p.id = auth.uid()));
create policy employees_insert on public.employees for insert to authenticated
  with check (public.has_perm('sys.users') or public.has_perm('hr.manage'));
create policy employees_update on public.employees for update to authenticated
  using (public.has_perm('sys.users') or public.has_perm('hr.manage'))
  with check (public.has_perm('sys.users') or public.has_perm('hr.manage'));
create policy employees_delete on public.employees for delete to authenticated
  using (public.has_perm('sys.users'));

-- Employees with their login account (if any), for the HR list and the admin's
-- "menunggu akses" list. HR sees whether an account exists, not its details.
create or replace function public.employees_overview() returns table (
  id text, full_name text, short_name text, job_title text, department text, plant_id text,
  email text, phone text, status text, created_at timestamptz,
  account_id uuid, account_status text, roles text[]
)
language sql stable security definer set search_path = '' as $$
  select e.id, e.full_name, e.short_name, e.job_title, e.department, e.plant_id,
         e.email, e.phone, e.status, e.created_at,
         p.id, p.status,
         coalesce((select array_agg(ur.role_key order by ur.is_default desc, ur.role_key)
                   from public.user_roles ur where ur.user_id = p.id), '{}')
  from public.employees e
  left join public.profiles p on p.employee_id = e.id
  where public.has_perm('sys.users') or public.has_perm('hr.manage')
  order by e.created_at desc;
$$;
grant execute on function public.employees_overview() to authenticated;
