-- A scheduled list's completion lives in two tables: its items are the
-- `items` jsonb column on `captures`, but whether it counts as "done" for
-- the Today ring is `done` on the `tasks` row that points back at it
-- (tasks.capture_id). Writing both as separate requests leaves a window
-- where they can disagree (e.g. the items save but the task doesn't, or
-- vice versa), so this function does both in one round trip, inside one
-- transaction, and runs with the caller's own row-level security.
create or replace function public.set_capture_items_and_sync_done(
  p_capture_id uuid,
  p_items jsonb,
  p_title text default null
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_item_count int;
  v_all_done boolean;
begin
  v_item_count := jsonb_array_length(p_items);
  v_all_done := v_item_count > 0 and not exists (
    select 1 from jsonb_array_elements(p_items) elem
    where coalesce((elem->>'done')::boolean, false) = false
  );

  update public.captures
    set items = p_items,
        title = case when p_title is null then title else p_title end
    where id = p_capture_id;

  -- a zero-item list has no derived done-state of its own (it behaves like
  -- a plain task, toggled directly), so its linked task's `done` is left
  -- exactly as it was.
  if v_item_count > 0 then
    update public.tasks set done = v_all_done where capture_id = p_capture_id;
  end if;
end;
$$;

grant execute on function public.set_capture_items_and_sync_done(uuid, jsonb, text) to authenticated;
