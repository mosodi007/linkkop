import { supabase } from './supabase';

export interface ContactProfile {
  id: string;
  name: string;
  photo: string;
  city: string;
}

export async function fetchMyContacts(): Promise<ContactProfile[]> {
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
