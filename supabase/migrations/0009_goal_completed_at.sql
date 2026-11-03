-- When a goal was completed (all its milestones ticked). Drives the order
-- of stars in the Goals "sky" and the "Lit on <date>" label. Set by the app
-- when the last milestone is ticked, cleared when one is unticked again.
-- Goals that were already complete before this column existed keep NULL
-- (their star shows without a date and sits at the start of the sky).
alter table public.goals
  add column if not exists completed_at timestamptz;
