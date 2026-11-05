-- Web push reminders: lets the server send a task's reminder (and the
-- 8am / 7pm check-ins) to a phone even when Lit is closed.

-- One row per device/browser that turned reminders on.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;
drop policy if exists "own rows" on public.push_subscriptions;
create policy "own rows" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Per-person settings the sender needs: their time zone (tasks store local
-- dates and times) and the daily check-ins, with the last day each was sent.
create table if not exists public.reminder_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/Dublin',
  daily_enabled boolean not null default true,
  last_morning_on text,
  last_evening_on text,
  updated_at timestamptz not null default now()
);
alter table public.reminder_prefs enable row level security;
drop policy if exists "own rows" on public.reminder_prefs;
create policy "own rows" on public.reminder_prefs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Which date+time a task's reminder was last sent for ("2026-11-05 14:30").
-- Comparing against the task's current date+time means editing the time
-- re-arms the reminder with no extra client code.
alter table public.tasks add column if not exists reminder_sent_for text;
