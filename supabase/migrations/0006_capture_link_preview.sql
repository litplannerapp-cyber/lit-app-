-- Inbox image/link captures.
--
-- 1. Adds cached Open Graph preview fields for "link" captures, populated
--    by the link-preview Edge Function right after capture (see
--    supabase/functions/link-preview). Browsers can't read another site's
--    HTML directly (CORS), so the preview is fetched server-side once and
--    cached here instead of being re-fetched on every render.
-- 2. Defensively re-asserts image_url with `add column if not exists` —
--    it has been part of this table since the very first migration, so
--    this is a no-op if your live database already matches 0001_init.sql.
--    It's here as a safety net in case the live table was provisioned by
--    hand from an earlier draft of that file.
alter table public.captures
  add column if not exists image_url text,
  add column if not exists preview_title text,
  add column if not exists preview_image text,
  add column if not exists preview_site text,
  add column if not exists preview_fetched_at timestamptz;
