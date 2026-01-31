import { supabase } from './supabase';
import type { PostRow, ProfileRow } from '@repo/shared';

export interface PostAuthor {
  id: string;
  name: string;
  photo: string;
  occupation: string;
  city: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: PostAuthor;
  content: string;
  image?: string;
  location: string;
  city: string;
  createdAt: string;
  likes: number;
  comments: number;
}

type PostWithAuthor = PostRow & {
  profiles: Pick<ProfileRow, 'id' | 'full_name' | 'avatar_url' | 'city'> | null;
};

function mapRowToPost(
  row: PostRow,
  author: { id: string; full_name: string; avatar_url: string | null; city: string | null }
): Post {
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

const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    authorId: '1',
    author: {
      id: '1',
      name: 'Amina Okonkwo',
      photo: 'https://images.unsplash.com/photo-1668752741330-8adc5cef7485?w=400&h=400&fit=crop',
      occupation: 'Marketing Manager',
      city: 'Lagos',
    },
    content:
      "Just wrapped an amazing networking event in Victoria Island. So many great connections made. If you're in Lagos and into tech & business, let's connect!",
    image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=500&fit=crop',
    location: 'Victoria Island, Lagos',
    city: 'Lagos',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 24,
    comments: 5,
  },
  {
    id: 'p2',
    authorId: '2',
    author: {
      id: '2',
      name: 'Chukwudi Eze',
      photo: 'https://images.unsplash.com/photo-1619452220963-4da4e145aba9?w=400&h=400&fit=crop',
      occupation: 'Software Engineer',
      city: 'Lagos',
    },
    content:
      'Coffee and code at a new spot in Lekki. The vibe here is perfect for getting work done. Who else works remotely from Lagos?',
    location: 'Lekki Phase 1, Lagos',
    city: 'Lagos',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likes: 18,
    comments: 3,
  },
  {
    id: 'p3',
    authorId: '3',
    author: {
      id: '3',
      name: 'Funmi Adeyemi',
      photo: 'https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?w=400&h=400&fit=crop',
      occupation: 'Fashion Designer',
      city: 'Lagos',
    },
    content:
      'New collection drop happening this weekend at the pop-up in Ikeja. Would love to see some familiar faces!',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop',
    location: 'Ikeja, Lagos',
    city: 'Lagos',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 42,
    comments: 12,
  },
];

export async function fetchFeedPosts(): Promise<Post[]> {
  if (!supabase) {
    return [...MOCK_POSTS].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
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
    `
    )
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
  imageUri?: string | null
): Promise<Post | null> {
  if (!supabase) return null;

  let imageUrl: string | null = null;
  if (imageUri) {
    const ext = imageUri.split('.').pop()?.toLowerCase()?.split('?')[0] || 'jpg';
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(path, blob, { upsert: false, contentType: blob.type || 'image/jpeg' });
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
