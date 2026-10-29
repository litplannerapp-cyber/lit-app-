-- One-off recovery: reconnect already-scheduled tasks to the Inbox capture
-- they came from, for any capture that happened to survive the old Schedule
-- bug (see 0007_task_capture_link.sql for the real fix).
--
-- Context: before the fix, Schedule copied only a capture's title into a
-- new task row, then called a hard DELETE on the capture with no undo
-- window. For the vast majority of already-scheduled lists/links, that
-- DELETE succeeded — the row and its items/url are genuinely gone, and no
-- SQL query can bring back data that's been hard-deleted (that needs a
-- full database restore / point-in-time recovery via the Supabase
-- dashboard, not a SQL Editor query).
--
-- The one case this script can fix: the DELETE request itself failed
-- (e.g. you were offline right after scheduling). In that case the
-- capture row — with its items/url intact — is still sitting in
-- `captures`, now duplicated by a task that has only its title. This
-- script finds those by matching (same user, same text, capture created
-- before the task) and links them via the new tasks.capture_id column.
--
-- Run the PREVIEW first. Only run the UPDATE if the preview's matches
-- actually look right to you — this is best-effort title matching, not a
-- guarantee, and two unrelated list captures that happen to share both a
-- title and a user could produce a false match.
--
-- Prerequisite: run 0007_task_capture_link.sql first (adds capture_id).

-- ============================================================
-- STEP 1 — PREVIEW: run this first, read it before running anything else.
-- ============================================================
select
  cap.id                           as capture_id,
  cap.type                         as capture_type,
  cap.title                        as capture_title,
  cap.url                          as capture_url,
  jsonb_array_length(cap.items)    as item_count,
  t.id                             as task_id,
  t.text                           as task_text,
  t.date_key                       as task_date_key,
  t.created_at                     as task_created_at,
  cap.created_at                   as capture_created_at
from public.captures cap
join public.tasks t
  on t.user_id = cap.user_id
  and t.capture_id is null                           -- not already linked
  and t.text = coalesce(cap.title, cap.text, cap.url) -- same fallback Schedule itself now uses
  and t.created_at >= cap.created_at                  -- task was created at/after the capture existed
where cap.type in ('list', 'link')
order by cap.created_at desc;

-- If this returns nothing, there is nothing to recover — the captures for
-- your already-scheduled lists/links were genuinely deleted, and the data
-- is gone. That's expected for the common case described above.

-- ============================================================
-- STEP 2 — RECOVERY: only run this after reviewing Step 1's output.
-- Links each matched task to its capture. Skips any task that's already
-- linked, and skips a capture if it would end up linked to more than one
-- task (picks the closest-in-time task per capture and leaves the rest
-- for you to sort out by hand).
-- ============================================================
with candidates as (
  select
    t.id as task_id,
    cap.id as capture_id,
    row_number() over (
      partition by t.id
      order by cap.created_at desc
    ) as task_rn,
    row_number() over (
      partition by cap.id
      order by t.created_at asc
    ) as capture_rn
  from public.tasks t
  join public.captures cap
    on cap.user_id = t.user_id
    and cap.type in ('list', 'link')
    and t.capture_id is null
    and t.text = coalesce(cap.title, cap.text, cap.url)
    and t.created_at >= cap.created_at
)
update public.tasks t
set capture_id = c.capture_id
from candidates c
where c.task_id = t.id
  and c.task_rn = 1
  and c.capture_rn = 1;

-- ============================================================
-- STEP 3 — VERIFY: confirm what actually got linked.
-- ============================================================
select t.id as task_id, t.text, t.date_key, cap.id as capture_id, cap.type, cap.title, jsonb_array_length(cap.items) as item_count
from public.tasks t
join public.captures cap on cap.id = t.capture_id
order by t.date_key;
