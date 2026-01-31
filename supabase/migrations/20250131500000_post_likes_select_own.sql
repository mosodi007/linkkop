-- Allow users to read their own like rows so the app can check "have I liked?" before toggling (unlike).
-- Post author can still read all likers via existing policy; this adds: user can read rows where they are the liker.
create policy "Users can read own like rows"
  on public.post_likes for select
  using (auth.uid() = user_id);
