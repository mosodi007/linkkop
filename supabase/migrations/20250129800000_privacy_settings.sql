-- Privacy and discovery settings on profiles
alter table public.profiles
  add column if not exists post_visibility text default 'everyone' check (post_visibility in ('everyone', 'contacts', 'only_me'));

alter table public.profiles
  add column if not exists profile_visibility text default 'everyone' check (profile_visibility in ('everyone', 'contacts', 'only_me'));

alter table public.profiles
  add column if not exists show_me_gender text default 'both' check (show_me_gender in ('females', 'males', 'both'));

alter table public.profiles
  add column if not exists show_me_scope text default 'my_location' check (show_me_scope in ('worldwide', 'my_location'));

alter table public.profiles
  add column if not exists age_min integer default 18 check (age_min >= 18 and age_min <= 99);

alter table public.profiles
  add column if not exists age_max integer default 99 check (age_max >= 18 and age_max <= 99);

alter table public.profiles
  add column if not exists show_me_interests text[] default '{}';
