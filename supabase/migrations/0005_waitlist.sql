-- 0005_waitlist.sql
-- Early-access waitlist for the litplanner.app landing page.
-- The browser inserts with the public anon key; RLS allows INSERT only (no read, update or delete).

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text,
  created_at  timestamptz not null default now(),
  constraint waitlist_email_unique  unique (email),
  constraint waitlist_email_lower   check (email = lower(email)),
  constraint waitlist_email_format  check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
  constraint waitlist_source_length check (source is null or char_length(source) <= 32)
);

alter table public.waitlist enable row level security;

drop policy if exists "Anyone can join the waitlist" on public.waitlist;
create policy "Anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);

revoke all on public.waitlist from anon, authenticated;
grant insert on public.waitlist to anon, authenticated;

comment on table public.waitlist is 'Landing page early-access sign-ups. Read via the Supabase dashboard or service role only.';
