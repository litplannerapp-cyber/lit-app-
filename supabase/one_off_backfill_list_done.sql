-- One-off backfill: recompute tasks.done for every scheduled list from its
-- current items. This covers lists that were already fully (or partially)
-- ticked before the done-sync logic existed, and any list whose items
-- changed while set_capture_items_and_sync_done() (0008_list_done_sync.sql)
-- either hadn't been created yet in this project or failed to save for some
-- other reason — in both cases tasks.done is left stuck at whatever it was,
-- disagreeing with what the items actually say.
--
-- Safe to run any number of times — it's a pure recompute, not additive.
-- The app itself also now derives a list's done-state live from its items
-- on every render (it never trusts this stored column alone, specifically
-- so this class of drift can't make a list look stuck again) — so running
-- this is about the stored column matching reality for any future reader
-- that queries it directly, not about what the app shows you today.
--
-- Prerequisite: run 0008_list_done_sync.sql first if you haven't. Step 0
-- below tells you whether that's needed.

-- ============================================================
-- STEP 0 — CHECK: does set_capture_items_and_sync_done() actually exist?
-- If this returns no rows, the function was never created in this
-- project, and every tick on a list item has been silently failing to
-- save (optimistic update, then rolled back with a "Couldn't save that
-- change" toast) ever since — run 0008_list_done_sync.sql in the SQL
-- Editor before anything else here.
-- ============================================================
select proname, pg_get_function_identity_arguments(oid) as args
from pg_proc
where proname = 'set_capture_items_and_sync_done'
  and pronamespace = 'public'::regnamespace;

-- ============================================================
-- STEP 1 — PREVIEW: every scheduled list task whose stored `done` disagrees
-- with what its items currently say. Read this before running Step 2.
-- ============================================================
select
  t.id as task_id,
  t.text as task_text,
  t.date_key,
  t.top3,
  t.done as stored_done,
  jsonb_array_length(cap.items) as item_count,
  (
    jsonb_array_length(cap.items) > 0
    and not exists (
      select 1 from jsonb_array_elements(cap.items) elem
      where coalesce((elem->>'done')::boolean, false) = false
    )
  ) as computed_done
from public.tasks t
join public.captures cap on cap.id = t.capture_id
where cap.type = 'list'
  and jsonb_array_length(cap.items) > 0
  and t.done is distinct from (
    not exists (
      select 1 from jsonb_array_elements(cap.items) elem
      where coalesce((elem->>'done')::boolean, false) = false
    )
  )
order by t.date_key desc;

-- ============================================================
-- STEP 2 — BACKFILL: recompute `done` for every scheduled list task from
-- its items, in both directions (marks fully-ticked lists done, and
-- reopens any list whose stored `done` was wrongly left true). Only
-- touches list tasks with at least one item — a zero-item list keeps
-- whatever `done` it already has, exactly like the app does.
-- ============================================================
update public.tasks t
set done = sub.computed_done
from (
  select
    t2.id as task_id,
    not exists (
      select 1 from jsonb_array_elements(cap.items) elem
      where coalesce((elem->>'done')::boolean, false) = false
    ) as computed_done
  from public.tasks t2
  join public.captures cap on cap.id = t2.capture_id
  where cap.type = 'list'
    and jsonb_array_length(cap.items) > 0
) sub
where sub.task_id = t.id
  and t.done is distinct from sub.computed_done;

-- ============================================================
-- STEP 3 — VERIFY: should return zero rows — nothing left to disagree.
-- ============================================================
select
  t.id as task_id, t.text, t.date_key, t.done as stored_done,
  jsonb_array_length(cap.items) as item_count
from public.tasks t
join public.captures cap on cap.id = t.capture_id
where cap.type = 'list'
  and jsonb_array_length(cap.items) > 0
  and t.done is distinct from (
    not exists (
      select 1 from jsonb_array_elements(cap.items) elem
      where coalesce((elem->>'done')::boolean, false) = false
    )
  );
