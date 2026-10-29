-- Fix: scheduling a list or link capture used to copy only its title into a
-- new task row, then hard-delete the original capture (and with it, the
-- list's items / the link's URL and preview — there was nowhere else they
-- lived). A scheduled task now instead references the capture it came from,
-- so the capture row stays the single source of truth for items/url/preview
-- and is simply no longer shown in the Inbox once something is scheduled
-- from it (computed client-side from this link, not a second stored flag).
alter table public.tasks
  add column if not exists capture_id uuid references public.captures(id) on delete set null;
create index if not exists tasks_capture_idx on public.tasks(capture_id) where capture_id is not null;
