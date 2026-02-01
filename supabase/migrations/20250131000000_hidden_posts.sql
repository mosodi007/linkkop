-- Hidden posts: per-user list of post IDs to exclude from feed ("Hide" action)
create table if not exists public.hidden_posts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create index if not exists hidden_posts_user_id_idx on public.hidden_posts(user_id);

alter table public.hidden_posts enable row level security;

-- Users can only see and manage their own hidden list
create policy "Users can view own hidden posts"
  on public.hidden_posts for select
  using (auth.uid() = user_id);

create policy "Users can hide posts for themselves"
  on public.hidden_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can unhide (delete) their hidden entry"
  on public.hidden_posts for delete
  using (auth.uid() = user_id);
