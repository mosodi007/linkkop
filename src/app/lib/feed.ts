import { supabase } from '@/app/lib/supabase';
import type { PostRow } from '@/app/types/database';
import type { ProfileRow } from '@/app/types/database';
import type { Post } from '@/app/data/mockPosts';
import { mockPosts } from '@/app/data/mockPosts';

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
  if (!supabase) {
    return [...mockPosts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
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

export async function createFeedPost(
  content: string,
  profile: ProfileRow,
  imageFile?: File | null
): Promise<Post | null> {
  if (!supabase) return null;

  let imageUrl: string | null = null;
  if (imageFile) {
    const ext = imageFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, imageFile, { upsert: false });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path);
      imageUrl = urlData?.publicUrl ?? null;
    }
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: profile.id,
      content: content.trim(),
      image_url: imageUrl,
      city: profile.city ?? null,
    })
    .select('id, author_id, content, image_url, location, city, likes_count, comments_count, created_at')
    .single();

  if (error || !data) return null;
  return mapRowToPost(data as PostRow, {
    id: profile.id,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    city: profile.city,
  });
}

export async function fetchMyPosts(profile: ProfileRow): Promise<Post[]> {
  if (!supabase) return [];
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
