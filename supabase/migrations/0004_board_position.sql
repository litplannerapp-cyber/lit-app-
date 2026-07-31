-- Board display order — lets people reorder Vision boards and have it stick
-- across reloads, instead of always falling back to creation order.
alter table public.boards
  add column position bigint not null default 0;
create index boards_user_position_idx on public.boards(user_id, position);
