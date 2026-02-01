import { supabase } from './supabase';
import type { ProfileRow } from '@repo/shared';

export interface UserProfileDisplay {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  interests: string[];
  phone: string | null;
  messenger: string[];
  socialNetworks: Record<string, string>;
  occupation?: string | null;
  distanceKm?: number | null;
}

function mapProfileToDisplay(row: ProfileRow): UserProfileDisplay {
  const social = (row.social_networks ?? {}) as Record<string, string>;
  return {
    id: row.id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url?.trim() || null,
    bio: row.bio?.trim() || null,
    city: row.city?.trim() || null,
    country: row.country?.trim() || null,
    interests: Array.isArray(row.interests) ? row.interests : [],
    phone: row.phone?.trim() || null,
    messenger: Array.isArray(row.messenger) ? row.messenger : [],
    socialNetworks: social && typeof social === 'object' ? social : {},
  };
}

/** Fetch a user's profile by id (for individual profile page). Uses profiles table. */
export async function fetchUserProfile(userId: string): Promise<UserProfileDisplay | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return mapProfileToDisplay(data as ProfileRow);
}
