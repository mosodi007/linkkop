-- Profiles: one per auth user, holds onboarding/profile data
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  interests text[] default '{}',
  phone text,
  messenger text check (messenger in ('whatsapp', 'none')),
  social_networks jsonb default '{}',
  avatar_url text,
  bio text,
  location_enabled boolean default false,
  lat numeric,
  lng numeric,
  city text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Posts: feed items, location-based
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  image_url text,
  location text,
  city text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now()
);

-- Connection requests: "request contact" between users
create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references public.profiles(id) on delete cascade,
  to_user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  unique (from_user_id, to_user_id)
);

-- Notifications (optional, for activity)
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text,
  body text,
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists posts_author_id_idx on public.posts(author_id);
create index if not exists posts_created_at_idx on public.posts(created_at desc);
create index if not exists posts_city_idx on public.posts(city);
create index if not exists connection_requests_from_idx on public.connection_requests(from_user_id);
create index if not exists connection_requests_to_idx on public.connection_requests(to_user_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id);

-- RLS
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.connection_requests enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read all (for discover/feed), update/insert own
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Posts: anyone can read; only author can insert/update/delete
create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

create policy "Users can insert own posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "Users can update own posts"
  on public.posts for update using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = author_id);

-- Connection requests: participants can read; from_user can insert; to_user can update (accept/reject)
create policy "Users can view their connection requests"
  on public.connection_requests for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create connection requests"
  on public.connection_requests for insert with check (auth.uid() = from_user_id);

create policy "Recipient can update connection request"
  on public.connection_requests for update using (auth.uid() = to_user_id);

create policy "Sender can delete own connection request"
  on public.connection_requests for delete using (auth.uid() = from_user_id);

-- Notifications: user can read/update own
create policy "Users can view own notifications"
  on public.notifications for select using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update using (auth.uid() = user_id);

-- Updated_at trigger for profiles
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
