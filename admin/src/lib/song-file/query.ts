import type { SupabaseClient } from '@supabase/supabase-js';

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

/** PostgREST caps a single response, so walk the table in pages. */
const PAGE_SIZE = 500;

export async function fetchSongRows(supabase: SupabaseClient<Database>): Promise<SongRow[]> {
  const rows: SongRow[] = [];

  for (let page = 0; ; page += 1) {
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from('songs')
      .select(SELECT)
      .order('name', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to read songs: ${error.message}`);
    if (!data || data.length === 0) break;

    rows.push(...(data as unknown as SongRow[]));
    if (data.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function buildSongFileFromDatabase(supabase: SupabaseClient<Database>): Promise<SongFile> {
  return buildSongFile(await fetchSongRows(supabase));
}
