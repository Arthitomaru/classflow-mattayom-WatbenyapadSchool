-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  role text not null check (role in ('teacher', 'student')),
  full_name text not null,
  created_at timestamptz default now()
);

-- Assignments table
create table public.assignments (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  due_date timestamptz,
  teacher_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Submissions table
create table public.submissions (
  id uuid default gen_random_uuid() primary key,
  assignment_id uuid references public.assignments(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  text_content text,
  file_url text,
  file_name text,
  status text default 'submitted' check (status in ('submitted', 'graded')),
  grade integer check (grade >= 0 and grade <= 100),
  feedback text,
  ai_feedback text,
  submitted_at timestamptz default now(),
  graded_at timestamptz,
  unique(assignment_id, student_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;

-- Profiles: users can read all profiles, only own profile writable
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Assignments: teachers manage their own, students can read all
create policy "assignments_select" on public.assignments for select using (true);
create policy "assignments_insert" on public.assignments for insert
  with check (
    auth.uid() = teacher_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
  );
create policy "assignments_update" on public.assignments for update
  using (auth.uid() = teacher_id);
create policy "assignments_delete" on public.assignments for delete
  using (auth.uid() = teacher_id);

-- Submissions: students manage their own, teachers read all
create policy "submissions_student_select" on public.submissions for select
  using (
    auth.uid() = student_id
    or exists (
      select 1 from public.assignments a
      join public.profiles p on p.id = auth.uid()
      where a.id = assignment_id and a.teacher_id = auth.uid() and p.role = 'teacher'
    )
  );
create policy "submissions_student_insert" on public.submissions for insert
  with check (
    auth.uid() = student_id
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
  );
create policy "submissions_student_update" on public.submissions for update
  using (
    auth.uid() = student_id
    or exists (
      select 1 from public.assignments a
      join public.profiles p on p.id = auth.uid()
      where a.id = assignment_id and a.teacher_id = auth.uid() and p.role = 'teacher'
    )
  );

-- Storage bucket for submission files
insert into storage.buckets (id, name, public) values ('submissions', 'submissions', false);

create policy "submissions_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
  );
create policy "submissions_storage_select" on storage.objects for select
  using (
    bucket_id = 'submissions'
    and auth.role() = 'authenticated'
  );

-- Trigger to auto-create profile after signup (optional — app also does it explicitly)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Profile is created explicitly by the app with role + full_name
  return new;
end;
$$;
