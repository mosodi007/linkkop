import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface ContactProfile {
  id: string;
  name: string;
  photo: string;
  city: string;
}

const MOCK_CONTACTS: ContactProfile[] = [
  {
    id: '1',
    name: 'Amina Okonkwo',
    photo: 'https://images.unsplash.com/photo-1668752741330-8adc5cef7485?w=400&h=400&fit=crop',
    city: 'Lagos',
  },
  {
    id: '2',
    name: 'Chukwudi Eze',
    photo: 'https://images.unsplash.com/photo-1619452220963-4da4e145aba9?w=400&h=400&fit=crop',
    city: 'Lagos',
  },
  {
    id: '3',
    name: 'Funmi Adeyemi',
    photo: 'https://images.unsplash.com/photo-1758611972971-1c8b9c6d7822?w=400&h=400&fit=crop',
    city: 'Lagos',
  },
];

async function fetchMyContacts(): Promise<ContactProfile[]> {
  if (!supabase) {
    return MOCK_CONTACTS;
  }
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) return [];

  const { data: contactRows, error: contactError } = await supabase
    .from('contacts')
    .select('contact_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (contactError || !contactRows?.length) return [];
  const ids = contactRows.map((r) => r.contact_id);

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, city')
    .in('id', ids);

  if (profileError || !profiles?.length) return [];
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return contactRows
    .map((r) => {
      const p = byId.get(r.contact_id);
      if (!p) return null;
      return {
        id: p.id,
        name: p.full_name,
        photo: p.avatar_url ?? '',
        city: p.city ?? '',
      };
    })
    .filter((c): c is ContactProfile => c != null);
}

export async function removeContact(contactId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.data?.session?.user?.id;
  if (!userId) return false;
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', userId)
    .eq('contact_id', contactId);
  return !error;
}

export function useContacts(): {
  contacts: ContactProfile[];
  loading: boolean;
  refresh: () => Promise<void>;
  removeContactById: (contactId: string) => Promise<void>;
} {
  const [contacts, setContacts] = useState<ContactProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!supabase) {
      setContacts(MOCK_CONTACTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await fetchMyContacts();
    setContacts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeContactById = useCallback(
    async (contactId: string) => {
      const ok = await removeContact(contactId);
      if (ok) {
        setContacts((prev) => prev.filter((c) => c.id !== contactId));
      }
    },
    []
  );

  return { contacts, loading, refresh: load, removeContactById };
}
