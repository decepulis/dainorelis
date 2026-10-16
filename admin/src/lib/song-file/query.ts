import type { SupabaseClient } from '@supabase/supabase-js';

import { fetchAll } from '@/lib/supabase/fetch-all';
import type { Database } from '@/lib/supabase/types';

import { type SongRow, buildSongFile } from './build';
import type { SongFile } from './types';

const SELECT = `
  id, name, tags, sources, recommended_key, music_author, text_author,
  lt_description, en_description, hide,
  lyrics       ( id, position, variant_name, en_variant_name, lyrics_and_chords, show_chords, notes ),
  translations ( id, position, variant_name, en_variant_name, title, lyrics, ai_generated, notes ),
  audio        ( id, position, variant_name, en_variant_name, url, album, artist ),
  pdfs         ( id, position, variant_name, en_variant_name, url ),
  videos       ( id, position, variant_name, en_variant_name, youtube_link )
`;

export async function fetchSongRows(supabase: SupabaseClient<Database>): Promise<SongRow[]> {
  const { data, error } = await fetchAll((from, to) =>
    supabase
      .from('songs')
      .select(SELECT)
      .order('name', { ascending: true })
      // Names are not unique, so without a tie-breaker two songs sharing a
      // name could swap across a page boundary and be skipped or duplicated.
      // The bundle's own order is set later by buildSongFile's en collation.
      .order('id', { ascending: true })
      .range(from, to)
  );

  if (error) throw new Error(`Failed to read songs: ${error.message}`);

  return data as unknown as SongRow[];
}

export async function buildSongFileFromDatabase(supabase: SupabaseClient<Database>): Promise<SongFile> {
  return buildSongFile(await fetchSongRows(supabase));
}
