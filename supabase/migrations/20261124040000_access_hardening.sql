-- JFRESH OS · tighten function access (Supabase security advisor).
-- employees_overview() is for signed-in HR / user admins only; trigger
-- functions are never called through the API (triggers still fire).
revoke execute on function public.employees_overview() from public, anon;
grant execute on function public.employees_overview() to authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.guard_profile_change() from public, anon, authenticated;
revoke execute on function public.guard_user_role_change() from public, anon, authenticated;
revoke execute on function public.guard_self_change() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
