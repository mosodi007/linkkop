-- Function to fetch comments visible to the current user for a post (for "Your comments" modal).
-- Returns: post author sees all comments; on others' posts, user sees only their own comments and replies to their comments.
create or replace function public.get_personal_comments_for_post(p_post_id uuid)
returns table (
  id uuid,
  author_id uuid,
  content text,
  created_at timestamptz,
  full_name text,
  avatar_url text
)
language sql
security definer
set search_path = public
stable
as $$
  select c.id, c.author_id, c.content, c.created_at, pr.full_name, pr.avatar_url
  from public.post_comments c
  join public.profiles pr on pr.id = c.author_id
  left join public.post_comments parent on parent.id = c.parent_id
  left join public.posts p on p.id = c.post_id
  where c.post_id = p_post_id
    and (
      p.author_id = auth.uid()
      or c.author_id = auth.uid()
      or (c.parent_id is not null and parent.author_id = auth.uid())
    )
  order by c.created_at asc;
$$;

grant execute on function public.get_personal_comments_for_post(uuid) to authenticated;
grant execute on function public.get_personal_comments_for_post(uuid) to anon;
