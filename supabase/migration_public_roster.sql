-- Migration: Public Read-Only Student Roster
-- Run this in the Supabase SQL editor once.

-- 0. Ensure class_name column exists (safe if already added)
alter table public.students
  add column if not exists class_name text default 'RCSB 1';

-- 1. Create a public read-only view that exposes only public columns
create or replace view public.public_student_roster

with (security_invoker = false)
as
select
  s.id,
  s.name,
  s.roll_no,
  s.class_name,
  s.chances_used,
  s.total_fine,
  case
    when s.chances_used >= coalesce((select chances_allowed from public.settings where id = 1), 1) then 'used'
    else 'open'
  end as chance_status,
  s.updated_at
from public.students s;

-- 2. Grant SELECT ONLY on the public view to anon and authenticated
grant select on public.public_student_roster to anon, authenticated;

-- Explicitly revoke all write privileges on the view
revoke insert, update, delete, truncate on public.public_student_roster from anon, authenticated;

-- 3. Grant column-level SELECT on students table for realtime subscriptions
grant select (id, name, roll_no, class_name, chances_used, total_fine, updated_at) on public.students to anon, authenticated;

-- 4. Enable dedicated RLS policy for anonymous SELECT on students
-- (Drop first if exists to allow rerunning cleanly)
drop policy if exists "Allow anon to select public student roster" on public.students;

create policy "Allow anon to select public student roster"
  on public.students
  for select
  to anon, authenticated
  using (true);

-- 5. Guarantee that anon NEVER has insert, update, or delete privileges on any table
revoke insert, update, delete, truncate on public.students from anon;
revoke insert, update, delete, truncate on public.admins from anon, authenticated;
revoke insert, update, delete, truncate on public.sessions from anon, authenticated;
revoke insert, update, delete, truncate on public.login_attempts from anon, authenticated;
revoke insert, update, delete, truncate on public.settings from anon, authenticated;
revoke insert, update, delete, truncate on public.incidents from anon, authenticated;

-- 6. Ensure admin mutating functions remain strictly service_role only
revoke execute on function public.log_student_incident(uuid) from anon, authenticated;
revoke execute on function public.undo_last_incident(uuid) from anon, authenticated;

-- 7. Add students table to Supabase Realtime publication (if not already included)
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'students'
  ) then
    alter publication supabase_realtime add table public.students;
  end if;
exception
  when undefined_object then
    -- publication might not exist in local/mock environments
    null;
end $$;
