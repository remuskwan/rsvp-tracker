-- Grant edit/persist access to ALL admins, not a single hardcoded email.
--
-- The original policies (0001_init.sql) hardcoded
--   auth.jwt() ->> 'email' = 'remuskwan23@gmail.com'
-- so only that one account could actually write, even though the app's
-- `admins` table gates who can log into the admin panel. Anyone else in the
-- `admins` table could log in but their saves silently failed RLS.
--
-- Repoint the policies at membership in the `admins` table via a
-- SECURITY DEFINER helper. Running as definer lets the membership lookup
-- bypass RLS on `admins`, avoiding recursive-policy / permission pitfalls.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins
    where email = auth.jwt() ->> 'email'
  );
$$;

-- wedding_info: only admins can update (public read policy is unchanged)
drop policy if exists "Admin can update wedding_info" on wedding_info;
create policy "Admin can update wedding_info"
  on wedding_info for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- rsvps: only admins can read / update / delete (public insert is unchanged)
drop policy if exists "Admin can read rsvps" on rsvps;
create policy "Admin can read rsvps"
  on rsvps for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin can update rsvps" on rsvps;
create policy "Admin can update rsvps"
  on rsvps for update
  to authenticated
  using (public.is_admin());

drop policy if exists "Admin can delete rsvps" on rsvps;
create policy "Admin can delete rsvps"
  on rsvps for delete
  to authenticated
  using (public.is_admin());
