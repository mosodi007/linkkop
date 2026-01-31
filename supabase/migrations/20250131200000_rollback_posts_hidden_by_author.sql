-- Rollback: remove hidden_by_author column from posts
alter table public.posts
  drop column if exists hidden_by_author;
