import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import type { DiscoverProfileRow } from '@repo/shared';

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

function mapRowToUser(row: DiscoverProfileRow): DiscoverUser {
  const social = (row.social_networks ?? {}) as Record<string, string>;
  return {
    id: row.id,
    name: row.full_name,
    age: ageFromDateOfBirth(row.date_of_birth),
    city: row.city ?? '',
    distance: Number(row.distance_km) ?? 0,
    photo: row.avatar_url ?? '',
    bio: row.bio ?? '',
    interests: row.interests ?? [],
    occupation: row.occupation ?? '',
    phone: row.phone ?? '',
    messenger: row.messenger ?? [],
    socialNetworks: social,
  };
}

const MOCK_DISCOVER_USERS: DiscoverUser[] = [
  {
    id: '1',
    name: 'Amina Okonkwo',
    age: 28,
    city: 'Lagos',
    distance: 2.5,
    photo: 'https://images.unsplash.com/photo-1668752741330-8adc5cef7485?w=400&h=400&fit=crop',
    bio: 'Marketing lead passionate about brand storytelling and connecting with people.',
    interests: ['Business', 'Networking', 'Tech'],
    occupation: 'Marketing Manager',
    phone: '+234 XXX XXX 7845',
    messenger: ['whatsapp', 'telegram'],
    socialNetworks: { linkedin: 'amina-okonkwo', twitter: '@aminao', instagram: '@amina.o' },
  },
  {
    id: '2',
    name: 'Chukwudi Eze',
    age: 32,
    city: 'Lagos',
    distance: 5.1,
    photo: 'https://images.unsplash.com/photo-1619452220963-4da4e145aba9?w=400&h=400&fit=crop',
    bio: 'Software engineer building products that make a difference.',
    interests: ['Business', 'Tech', 'Startups'],
    occupation: 'Software Engineer',
    phone: '+234 XXX XXX 9234',
    messenger: ['whatsapp', 'signal'],
    socialNetworks: { linkedin: 'chukwudi-eze', facebook: 'chukwudi.eze', instagram: '@chukwudi' },
  },
  {
    id: '3',
    name: 'Funmi Adeyemi',
    age: 25,
    city: 'Lagos',
    distance: 1.8,
    photo: 'https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?w=400&h=400&fit=crop',
    bio: 'Fashion designer and creative. Always up for a good conversation.',
    interests: ['Fashion', 'Networking', 'Art'],
    occupation: 'Fashion Designer',
    phone: '+234 XXX XXX 5678',
    messenger: ['whatsapp', 'telegram', 'line'],
    socialNetworks: { twitter: '@funmi_a', instagram: '@funmi.adeyemi', linkedin: 'funmi-adeyemi' },
  },
  {
    id: '4',
    name: 'Zainab Ibrahim',
    age: 30,
    city: 'Lagos',
    distance: 3.2,
    photo: 'https://images.unsplash.com/photo-1687422808311-a776f467a468?w=400&h=400&fit=crop',
    bio: 'Business consultant helping SMEs grow. Love networking and coffee.',
    interests: ['Business', 'Networking', 'Finance'],
    occupation: 'Business Consultant',
    phone: '+234 XXX XXX 3421',
    messenger: ['whatsapp', 'viber'],
    socialNetworks: { linkedin: 'zainab-ibrahim', instagram: '@zainab.i', facebook: 'zainab.ibrahim' },
  },
  {
    id: '5',
    name: 'Tunde Bakare',
    age: 29,
    city: 'Lagos',
    distance: 4.7,
    photo: 'https://images.unsplash.com/photo-1668752600261-e56e7f3780b6?w=400&h=400&fit=crop',
    bio: 'Financial analyst. Interested in markets, tech, and meeting new people.',
    interests: ['Business', 'Networking', 'Finance'],
    occupation: 'Financial Analyst',
    phone: '+234 XXX XXX 8912',
    messenger: ['whatsapp', 'telegram', 'signal'],
    socialNetworks: { linkedin: 'tunde-bakare', twitter: '@tunde_b', instagram: '@tundebakare' },
  },
  {
    id: '6',
    name: 'Ngozi Eze',
    age: 27,
    city: 'Lagos',
    distance: 0.9,
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
    bio: 'Content creator and artist. Music and stories are my language.',
    interests: ['Art', 'Music', 'Networking'],
    occupation: 'Content Creator',
    phone: '+234 XXX XXX 1122',
    messenger: ['whatsapp', 'telegram', 'imo'],
    socialNetworks: { instagram: '@ngozi.e', twitter: '@ngozi_eze' },
  },
];

export function useDiscoverProfiles(): {
  users: DiscoverUser[];
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(!!supabase);

  const load = useCallback(async () => {
    if (!supabase) {
      setUsers(MOCK_DISCOVER_USERS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles_discover')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setUsers(MOCK_DISCOVER_USERS);
    } else {
      setUsers((data ?? []).map((row) => mapRowToUser(row as DiscoverProfileRow)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { users, loading, refresh: load };
}
