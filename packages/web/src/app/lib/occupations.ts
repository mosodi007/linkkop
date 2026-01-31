import { supabase } from '@/app/lib/supabase';
import type { OccupationRow } from '@/app/types/database';

export type Occupation = OccupationRow;

/** Fetch all occupations from the database (read-only, RLS allows select for all). */
export async function fetchOccupations(): Promise<Occupation[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('occupations')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) return [];
  return (data ?? []) as Occupation[];
}
