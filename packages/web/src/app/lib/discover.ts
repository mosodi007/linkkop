import { useState, useEffect } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { DiscoverProfileRow, DiscoverPostRow } from '@/app/types/database';
import type { User } from '@/app/data/mockUsers';
import { mockUsers } from '@/app/data/mockUsers';
import type { Post } from '@/app/data/mockPosts';

function ageFromDateOfBirth(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 25;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (
    today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())
  ) {
    age--;
  }
  return Math.max(18, Math.min(99, age));
}

export function mapDiscoverProfileToUser(row: DiscoverProfileRow): User {
  const social = (row.social_networks ?? {}) as Record<string, string>;
  return {
    id: row.id,
    name: row.full_name,
    age: ageFromDateOfBirth(row.date_of_birth),
    gender: 'other',
    city: row.city ?? '',
    distance: Number(row.distance_km) ?? 0,
    photo: row.avatar_url ?? '',
    bio: row.bio ?? '',
    interests: row.interests ?? [],
    socialNetworks: {
      linkedin: social.linkedin,
      twitter: social.twitter,
      instagram: social.instagram,
      facebook: social.facebook,
    },
    phone: row.phone ?? '',
    occupation: row.occupation ?? '',
    messenger: row.messenger ?? [],
  };
}

export function useDiscoverProfiles(): {
  users: User[];
  loading: boolean;
  error: Error | null;
} {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!supabase) {
      setUsers(mockUsers);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error: e } = await supabase
        .from('profiles_discover')
        .select('*')
        .order('created_at', { ascending: false });
      if (cancelled) return;
      if (e) {
        setError(e as Error);
        setUsers(mockUsers);
      } else {
        setUsers((data ?? []).map(mapDiscoverProfileToUser));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { users, loading, error };
}

export async function fetchDiscoverProfileById(
  id: string
): Promise<User | null> {
  if (!supabase) {
    return mockUsers.find((u) => u.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from('profiles_discover')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapDiscoverProfileToUser(data as DiscoverProfileRow);
}

function mapDiscoverPostToPost(row: DiscoverPostRow, author: User): Post {
  return {
    id: row.id,
    authorId: row.author_id,
    author: {
      id: author.id,
      name: author.name,
      photo: author.photo,
      occupation: author.occupation,
      city: author.city,
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

export async function fetchDiscoverPostsByAuthorId(
  authorId: string,
  author: User
): Promise<Post[]> {
  if (!supabase) {
    const mockPostList = (await import('@/app/data/mockPosts')).mockPosts;
    return mockPostList
      .filter((p) => p.authorId === authorId)
      .map((p) => ({ ...p, author: { id: author.id, name: author.name, photo: author.photo, occupation: author.occupation, city: author.city } }));
  }
  const { data, error } = await supabase
    .from('posts_discover')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as DiscoverPostRow[]).map((row) =>
    mapDiscoverPostToPost(row, author)
  );
}
