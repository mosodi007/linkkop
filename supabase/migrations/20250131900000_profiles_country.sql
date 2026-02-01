-- Add country (ISO2 code, e.g. 'NG') to profiles for display on user profile
alter table public.profiles
  add column if not exists country text;
