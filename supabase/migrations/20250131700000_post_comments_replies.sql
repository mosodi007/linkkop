-- post_comments: add optional parent for replies
alter table public.post_comments
  add column if not exists parent_id uuid references public.post_comments(id) on delete cascade;

create index if not exists post_comments_parent_id_idx on public.post_comments(parent_id);

-- Users can read replies to their comments (on others' posts)
drop policy if exists "Users can read replies to their comments" on public.post_comments;
create policy "Users can read replies to their comments"
  on public.post_comments for select
  using (
    parent_id is not null
    and exists (
      select 1 from public.post_comments parent
      where parent.id = post_comments.parent_id
        and parent.author_id = auth.uid()
    )
  );
