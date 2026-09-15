-- Add class_name for existing projects that already ran schema.sql
alter table public.students
  add column if not exists class_name text;

update public.students
set class_name = 'RCSB 1'
where class_name is null or class_name = '';

alter table public.students
  alter column class_name set default 'RCSB 1';

alter table public.students
  alter column class_name set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'students_class_name_check'
  ) then
    alter table public.students
      add constraint students_class_name_check
      check (class_name in ('RCSB 1', 'RCSB 2', 'RCSB 3'));
  end if;
end $$;

create index if not exists students_class_name_idx on public.students (class_name);
