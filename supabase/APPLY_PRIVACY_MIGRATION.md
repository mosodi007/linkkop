# Apply privacy settings migration

The error **"Could not find the 'age_max' column of 'profiles' in the schema cache"** means the privacy columns are not yet on your **remote** Supabase project.

## Option A: Run SQL in Supabase Dashboard (recommended)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Paste and run the contents of `migrations/20250129800000_privacy_settings.sql` (or the SQL below).
4. Wait a few seconds for the schema cache to refresh, then try saving Privacy settings again.

```sql
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
```

## Option B: Use Supabase CLI

If your project is linked:

```bash
supabase link   # if not already linked
supabase db push
```

After applying, if the error persists, wait ~30 seconds or reload the app; PostgREST may need a moment to refresh its schema cache.
