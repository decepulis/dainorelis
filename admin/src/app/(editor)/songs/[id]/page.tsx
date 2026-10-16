import { notFound } from 'next/navigation';

import { SONG_SELECT } from '@/lib/song-file/query';
import { createClient } from '@/lib/supabase/server';

import SongEditor from './song-editor';

export default async function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: song, error } = await supabase.from('songs').select(SONG_SELECT).eq('id', id).maybeSingle();

  if (error) throw new Error(error.message);
  if (!song) notFound();

  return <SongEditor song={song as never} />;
}
