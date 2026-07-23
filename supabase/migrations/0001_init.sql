-- Lit: Calm Daily Planner — initial schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query).
-- Mirrors the shape of seedTasks()/seedCaptures()/seedBoards()/seedGoals() from the prototype.

create extension if not exists pgcrypto;

-- ---------- profiles (display name + onboarding flag; auth itself lives in auth.users) ----------
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- tasks ----------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  notes text not null default '',
  date_key text not null,           -- 'YYYY-MM-DD'
  done boolean not null default false,
  top3 boolean not null default false,
  time text,
  end_time text,
  period text,                      -- 'morning' | 'afternoon' | 'evening'
  priority boolean not null default false,
  group_name text,
  group_color text,
  created_at timestamptz not null default now()
);
create index tasks_user_date_idx on public.tasks(user_id, date_key);

-- ---------- captures (Inbox) ----------
create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,               -- 'note' | 'task' | 'list' | 'image' | 'link'
  title text,
  text text,
  url text,
  image_url text,
  items jsonb not null default '[]'::jsonb,   -- [{ text, done }]
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index captures_user_idx on public.captures(user_id);

-- ---------- vision boards ----------
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  cover_url text,
  created_at timestamptz not null default now()
);

-- ---------- vision items (board_id null = "not on a board yet") ----------
create table public.vision_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board_id uuid references public.boards(id) on delete set null,
  type text not null,               -- 'text' | 'image' | 'link'
  content text not null,
  tags text[] not null default '{}',
  position bigint not null default 0,
  created_at timestamptz not null default now()
);
create index vision_items_board_idx on public.vision_items(board_id);
create index vision_items_user_idx on public.vision_items(user_id);

-- ---------- goals + milestones ----------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_date date,
  created_at timestamptz not null default now()
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index milestones_goal_idx on public.milestones(goal_id);

-- ---------- finance ----------
create table public.finance_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  income numeric
);

create table public.finance_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  category text not null,
  recurring boolean not null default true,
  month_key text,                              -- only set when recurring = false
  paid boolean not null default false,          -- only used when recurring = false
  paid_months jsonb not null default '{}'::jsonb, -- { "2026-07": true } — only used when recurring = true
  created_at timestamptz not null default now()
);
create index finance_bills_user_idx on public.finance_bills(user_id);

create table public.finance_extras (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  month_key text not null,
  carried_from text,
  kind text,                                    -- 'savings' | null
  created_at timestamptz not null default now()
);
create index finance_extras_user_month_idx on public.finance_extras(user_id, month_key);

create table public.finance_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null,
  count int not null default 1,
  month_key text not null,
  carried_from text,
  created_at timestamptz not null default now()
);
create index finance_expenses_user_month_idx on public.finance_expenses(user_id, month_key);

-- ---------- streak tracking ----------
create table public.cleared_days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date_key text not null,
  primary key (user_id, date_key)
);

-- ---------- row level security: every table is private to its owner ----------
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.captures enable row level security;
alter table public.boards enable row level security;
alter table public.vision_items enable row level security;
alter table public.goals enable row level security;
alter table public.milestones enable row level security;
alter table public.finance_profile enable row level security;
alter table public.finance_bills enable row level security;
alter table public.finance_extras enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.cleared_days enable row level security;

create policy "own row" on public.profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.tasks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.captures for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.boards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.vision_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.goals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.milestones for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own row" on public.finance_profile for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.finance_bills for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.finance_extras for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.finance_expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.cleared_days for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
