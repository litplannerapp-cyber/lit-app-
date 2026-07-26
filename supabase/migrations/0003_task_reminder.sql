-- Per-task reminder flag — drives a scheduled local notification at the
-- task's own date_key + time, on top of the app's fixed daily reminders.
alter table public.tasks
  add column reminder boolean not null default false;
