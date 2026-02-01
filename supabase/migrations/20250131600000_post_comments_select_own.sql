-- Allow users to read their own comments so insert().select() returns the row after adding a comment.
drop policy if exists "Users can read own comments" on public.post_comments;
create policy "Users can read own comments"
  on public.post_comments for select
  using (auth.uid() = author_id);
