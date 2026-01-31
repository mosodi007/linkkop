import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import type { ProfileRow, DiscoverPostRow } from '@/app/types/database';
import type { User } from '@/app/data/mockUsers';
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

/** Maps a row from the profiles table to the Discover User type. */
export function mapProfileToUser(row: ProfileRow): User {
  const social = (row.social_networks ?? {}) as Record<string, string>;
  return {
    id: row.id,
    name: row.full_name,
    age: ageFromDateOfBirth(row.date_of_birth),
    gender: 'other',
    city: row.city ?? '',
    distance: 0,
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
    occupation: 'Member',
    messenger: row.messenger ?? [],
  };
}

/** Fetches registered users from the profiles table. Pass current user id to exclude self. */
export function useDiscoverProfiles(excludeUserId?: string | null): {
  users: User[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (e) {
      setError(e as Error);
      setUsers([]);
    } else {
      const list = (data ?? []).map((row) => mapProfileToUser(row as ProfileRow));
      const filtered = excludeUserId
        ? list.filter((u) => u.id !== excludeUserId)
        : list;
      setUsers(filtered);
    }
    setLoading(false);
  }, [excludeUserId]);

  useEffect(() => {
    load();
  }, [load]);

  return { users, loading, error, refresh: load };
}

export async function fetchDiscoverProfileById(
  id: string
): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return mapProfileToUser(data as ProfileRow);
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
  if (!supabase) return [];
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
