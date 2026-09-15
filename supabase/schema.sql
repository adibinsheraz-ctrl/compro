-- Kips College Chance & Fine Tracker
-- Run this in the Supabase SQL editor once.

-- Extensions
create extension if not exists "pgcrypto";

-- Admins (custom auth — password stored as bcrypt hash only)
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Sessions (server-side session store)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.admins(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);

create index if not exists sessions_expires_at_idx on public.sessions (expires_at);

-- Login rate limiting
create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  username text,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index if not exists login_attempts_ip_time_idx
  on public.login_attempts (ip, attempted_at desc);

-- Settings (single row intended)
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  fine_amount integer not null default 50 check (fine_amount >= 0),
  chances_allowed integer not null default 1 check (chances_allowed >= 1),
  updated_at timestamptz not null default now()
);

insert into public.settings (id, fine_amount, chances_allowed)
values (1, 50, 1)
on conflict (id) do nothing;

-- Students
-- chances_used: how many free chances have been consumed (never decreases except via explicit undo)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roll_no text not null,
  chances_used integer not null default 0 check (chances_used >= 0),
  total_fine integer not null default 0 check (total_fine >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (roll_no)
);

create index if not exists students_name_idx on public.students (name);
create index if not exists students_roll_no_idx on public.students (roll_no);

-- Incidents
create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  incident_date date not null default (timezone('utc', now()))::date,
  type text not null check (type in ('chance_used', 'fine')),
  amount integer not null default 0 check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists incidents_student_id_idx on public.incidents (student_id, created_at desc);

-- Atomic incident logger (prevents race double-counts)
create or replace function public.log_student_incident(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings public.settings%rowtype;
  v_student public.students%rowtype;
  v_type text;
  v_amount integer;
  v_incident public.incidents%rowtype;
begin
  select * into v_settings from public.settings where id = 1 for update;
  if not found then
    raise exception 'Settings not configured';
  end if;

  select * into v_student from public.students where id = p_student_id for update;
  if not found then
    raise exception 'Student not found';
  end if;

  if v_student.chances_used < v_settings.chances_allowed then
    v_type := 'chance_used';
    v_amount := 0;
    update public.students
      set chances_used = chances_used + 1,
          updated_at = now()
      where id = p_student_id
      returning * into v_student;
  else
    v_type := 'fine';
    v_amount := v_settings.fine_amount;
    update public.students
      set total_fine = total_fine + v_amount,
          updated_at = now()
      where id = p_student_id
      returning * into v_student;
  end if;

  insert into public.incidents (student_id, type, amount)
  values (p_student_id, v_type, v_amount)
  returning * into v_incident;

  return jsonb_build_object(
    'incident', row_to_json(v_incident),
    'student', row_to_json(v_student),
    'result_type', v_type,
    'amount', v_amount,
    'chances_allowed', v_settings.chances_allowed
  );
end;
$$;

-- Undo last incident (correction only — never regenerates chances except by reversing a chance log)
create or replace function public.undo_last_incident(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_incident public.incidents%rowtype;
  v_student public.students%rowtype;
begin
  select * into v_incident
  from public.incidents
  where student_id = p_student_id
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No incidents to undo';
  end if;

  select * into v_student from public.students where id = p_student_id for update;

  if v_incident.type = 'chance_used' then
    update public.students
      set chances_used = greatest(chances_used - 1, 0),
          updated_at = now()
      where id = p_student_id
      returning * into v_student;
  else
    update public.students
      set total_fine = greatest(total_fine - v_incident.amount, 0),
          updated_at = now()
      where id = p_student_id
      returning * into v_student;
  end if;

  delete from public.incidents where id = v_incident.id;

  return jsonb_build_object(
    'undone', row_to_json(v_incident),
    'student', row_to_json(v_student)
  );
end;
$$;

-- Seed admin: username kips@7777 / password kips@8888 (hash only — never store plaintext)
-- Hash generated with bcrypt cost 12
insert into public.admins (username, password_hash)
values (
  'kips@7777',
  '$2b$12$5s5QGMztiu2CXzmPN6Fkv.aYBY9IoaI5.lRIk1I5dP..fTX0mbIFu'
)
on conflict (username) do nothing;

-- Row Level Security: anon/authenticated get ZERO access.
-- The Next.js server uses the service role key after verifying a session cookie.
alter table public.admins enable row level security;
alter table public.sessions enable row level security;
alter table public.login_attempts enable row level security;
alter table public.settings enable row level security;
alter table public.students enable row level security;
alter table public.incidents enable row level security;

-- Explicit deny policies (no public policies that grant access)
revoke all on public.admins from anon, authenticated;
revoke all on public.sessions from anon, authenticated;
revoke all on public.login_attempts from anon, authenticated;
revoke all on public.settings from anon, authenticated;
revoke all on public.students from anon, authenticated;
revoke all on public.incidents from anon, authenticated;

revoke execute on function public.log_student_incident(uuid) from anon, authenticated;
revoke execute on function public.undo_last_incident(uuid) from anon, authenticated;

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant execute on function public.log_student_incident(uuid) to service_role;
grant execute on function public.undo_last_incident(uuid) to service_role;
