-- post_likes: who liked which post (only post author can read who liked)
create table if not exists public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create index if not exists post_likes_post_id_idx on public.post_likes(post_id);
create index if not exists post_likes_user_id_idx on public.post_likes(user_id);

alter table public.post_likes enable row level security;

-- Select: only the post author can read rows (to see who liked)
create policy "Post author can read post_likes"
  on public.post_likes for select
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

-- Insert: authenticated user can like (insert own row)
create policy "Users can insert own like"
  on public.post_likes for insert
  with check (auth.uid() = user_id);

-- Delete: user can unlike only their own row
create policy "Users can delete own like"
  on public.post_likes for delete
  using (auth.uid() = user_id);

-- post_comments: comments on posts (only post author can read)
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index if not exists post_comments_post_id_idx on public.post_comments(post_id);
create index if not exists post_comments_author_id_idx on public.post_comments(author_id);

alter table public.post_comments enable row level security;

-- Select: only the post author can read comments
create policy "Post author can read post_comments"
  on public.post_comments for select
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

-- Insert: authenticated user can comment
create policy "Users can insert own comment"
  on public.post_comments for insert
  with check (auth.uid() = author_id);

-- Update: comment author or post author can update
create policy "Comment or post author can update comment"
  on public.post_comments for update
  using (
    auth.uid() = author_id
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

-- Delete: comment author or post author can delete
create policy "Comment or post author can delete comment"
  on public.post_comments for delete
  using (
    auth.uid() = author_id
    or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
  );

-- Trigger: sync posts.likes_count on post_likes insert/delete
create or replace function public.sync_post_likes_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists post_likes_sync_count on public.post_likes;
create trigger post_likes_sync_count
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

-- Trigger: sync posts.comments_count on post_comments insert/delete
create or replace function public.sync_post_comments_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comments_count = greatest(0, comments_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists post_comments_sync_count on public.post_comments;
create trigger post_comments_sync_count
  after insert or delete on public.post_comments
  for each row execute function public.sync_post_comments_count();
