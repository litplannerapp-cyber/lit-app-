-- Face ID lock preference — travels with the user's Supabase profile so it
-- follows them across devices, instead of living only in localStorage.
alter table public.profiles
  add column face_id_enabled boolean not null default false;
