import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { ProfileRow } from '@repo/shared';

export interface DiscoverUser {
  id: string;
  name: string;
  age: number;
  city: string;
  distance: number;
  photo: string;
  bio: string;
  interests: string[];
  occupation: string;
  phone: string;
  messenger: string[];
  socialNetworks: Record<string, string>;
}

function ageFromDateOfBirth(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 25;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) {
    age--;
  }
  return Math.max(18, Math.min(99, age));
}

function mapProfileToDiscoverUser(row: ProfileRow): DiscoverUser {
  const social = (row.social_networks ?? {}) as Record<string, string>;
  return {
    id: row.id,
    name: row.full_name,
    age: ageFromDateOfBirth(row.date_of_birth),
    city: row.city ?? '',
    distance: 0,
    photo: row.avatar_url ?? '',
    bio: row.bio ?? '',
    interests: row.interests ?? [],
    occupation: 'Member',
    phone: row.phone ?? '',
    messenger: row.messenger ?? [],
    socialNetworks: social,
  };
}

/** Fetches registered users from profiles table for Discover. Pass current user id to exclude self. */
export function useDiscoverProfiles(excludeUserId?: string | null): {
  users: DiscoverUser[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(!!supabase);

  const load = useCallback(async () => {
    if (!supabase) {
      setUsers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setUsers([]);
    } else {
      const list = (data ?? []).map((row) => mapProfileToDiscoverUser(row as ProfileRow));
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

  return { users, loading, refresh: load };
}
