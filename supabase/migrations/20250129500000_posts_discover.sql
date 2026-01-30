-- Posts for discover profiles (browse-only users). Author = profiles_discover.id.
create table if not exists public.posts_discover (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles_discover(id) on delete cascade,
  content text not null,
  image_url text,
  location text,
  city text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamptz default now()
);

create index if not exists posts_discover_author_id_idx on public.posts_discover(author_id);
create index if not exists posts_discover_created_at_idx on public.posts_discover(created_at desc);

alter table public.posts_discover enable row level security;

create policy "Posts discover are viewable by everyone"
  on public.posts_discover for select using (true);
