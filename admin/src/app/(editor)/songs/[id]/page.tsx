import { notFound } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import SongEditor from './song-editor';

export const dynamic = 'force-dynamic';

const SELECT = `
  id, name, tags, sources, recommended_key, music_author, text_author,
  lt_description, en_description, hide,
  lyrics       ( id, position, variant_name, en_variant_name, lyrics_and_chords, show_chords, notes ),
  translations ( id, position, variant_name, en_variant_name, title, lyrics, ai_generated, notes ),
  audio        ( id, position, variant_name, en_variant_name, url, album, artist ),
  pdfs         ( id, position, variant_name, en_variant_name, url ),
  videos       ( id, position, variant_name, en_variant_name, youtube_link )
`;

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: song, error } = await supabase.from('songs').select(SELECT).eq('id', id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!song) notFound();

  return <SongEditor song={song as never} />;
}
