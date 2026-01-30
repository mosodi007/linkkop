-- Discover/browse-only profiles (no auth FK). Used for seeded mock users and discover feed.
create table if not exists public.profiles_discover (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date,
  interests text[] default '{}',
  phone text,
  messenger text[] default '{}',
  social_networks jsonb default '{}',
  avatar_url text,
  bio text,
  city text,
  occupation text,
  distance_km numeric default 0,
  created_at timestamptz default now()
);

create index if not exists profiles_discover_created_at_idx on public.profiles_discover(created_at desc);
create index if not exists profiles_discover_city_idx on public.profiles_discover(city);

alter table public.profiles_discover enable row level security;

create policy "Profiles discover are viewable by everyone"
  on public.profiles_discover for select using (true);
