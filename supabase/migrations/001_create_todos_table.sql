-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create todos table
create table public.todos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  priority text check (priority in ('low', 'medium', 'high')),
  source_url text,
  source_type text check (source_type in ('popup', 'context_menu', 'github', 'email')),
  github_issue_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  due_date date,
  tags text[]
);

-- Create indexes
create index todos_user_id_status_idx on todos(user_id, status);
create index todos_user_id_created_idx on todos(user_id, created_at desc);
create index todos_user_id_updated_idx on todos(user_id, updated_at desc);

-- Enable RLS
alter table public.todos enable row level security;

-- RLS policy: users can only read/write their own todos
create policy "Users can only access their own todos"
  on todos
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow inserting with user_id
create policy "Users can insert their own todos"
  on todos
  for insert
  with check (auth.uid() = user_id);
