-- Run this in the Supabase SQL Editor after creating the project.
-- Supabase Auth stores and verifies passwords; this table stores app profile data only.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  role text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  student_id text unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can create their student profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id and role = 'student');

create or replace function public.create_student_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role, student_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'student',
    nullif(new.raw_user_meta_data ->> 'student_id', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.create_student_profile();

-- Create teacher/admin profiles only through the Supabase SQL editor after
-- creating the corresponding Auth user. Never expose a service-role key in Vite.
