import { supabase } from './supabase';
import type { PostRow, ProfileRow } from '../types/database';
import type { Post } from './discover';

type PostWithAuthor = PostRow & {
  profiles: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url' | 'city'> | null;
};

function mapRowToPost(row: PostRow, author: { id: string; full_name: string; avatar_url: string | null; city: string | null }): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    author: {
      id: author.id,
      name: author.full_name,
      photo: author.avatar_url ?? '',
      occupation: 'Member',
      city: author.city ?? '',
    },
    content: row.content,
    image: row.image_url ?? undefined,
    location: row.location ?? '',
    city: row.city ?? '',
    createdAt: row.created_at,
    likes: row.likes_count,
    comments: row.comments_count,
  };
}

export async function fetchFeedPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id,
      author_id,
      content,
      image_url,
      location,
      city,
      likes_count,
      comments_count,
      created_at,
      profiles (
        id,
        full_name,
        avatar_url,
        city
      )
    `)
    .order('created_at', { ascending: false });

  if (error) return [];
  const rows = (data ?? []) as PostWithAuthor[];
  return rows.map((row) => {
    const author = row.profiles ?? {
      id: row.author_id,
      full_name: 'Unknown',
      avatar_url: null,
      city: null,
    };
    return mapRowToPost(row, author);
  });
}

export async function fetchMyPosts(profile: ProfileRow): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, author_id, content, image_url, location, city, likes_count, comments_count, created_at')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  const author = {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    city: profile.city,
  };
  return (data as PostRow[]).map((row) => mapRowToPost(row, author));
}
