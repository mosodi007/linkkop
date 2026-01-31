-- Posts are public unless the author hides them. Only the poster can hide their post.
alter table public.posts
  add column if not exists hidden_by_author boolean not null default false;

comment on column public.posts.hidden_by_author is 'When true, the post is hidden by the author and does not appear in public feed or profile.';
