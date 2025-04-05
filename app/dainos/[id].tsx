import { Fragment, useMemo, useState } from 'react';

import { Stack, useLocalSearchParams } from 'expo-router';

import Lyrics from '@/lib/components/Lyrics';
import Player from '@/lib/components/Player';
import SongHeader from '@/lib/components/SongHeader';
import { Audio } from '@/lib/schemas/audio';
import { Lyrics as LyricsType } from '@/lib/schemas/lyrics';
import { PDFs } from '@/lib/schemas/pdfs';
import { Song } from '@/lib/schemas/songs';
import { Videos } from '@/lib/schemas/videos';
import getTitle from '@/lib/utils/getTitle';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const { id } = useLocalSearchParams();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]) as Song;

  // Variants
  // TODO persist last used variant in storage
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const variants: (LyricsType | PDFs)[] = useMemo(
    () => [...(song.fields.Lyrics || []), ...(song.fields.PDFs || [])],
    [song]
  );
  const activeVariant = useMemo(() => variants[activeVariantIndex], [variants, activeVariantIndex]);

  // Title
  const title = useMemo(() => getTitle(song, variants, activeVariant), [song, variants, activeVariant]);
  const [isTitleBehind, setIsTitleBehind] = useState(false);

  // Media
  const [activeMediaIndex, setActiveMediaIndex] = useState<number | null>(null);
  const media: (Audio | Videos)[] = useMemo(
    () => [...(song.fields.Audio || []), ...(song.fields.Videos || [])],
    [song]
  );
  const activeMedia = useMemo(
    () => (typeof activeMediaIndex === 'number' ? media[activeMediaIndex] : null),
    [activeMediaIndex, media]
  );

  // PROP DRILLING! I tried doing this with context but SongHeader being rendered at the root made it complicated
  return (
    <Fragment>
      <Stack.Screen
        options={{
          header: () => (
            <SongHeader
              title={title}
              isTitleBehind={isTitleBehind}
              song={song}
              variants={variants}
              activeVariant={activeVariant}
              setActiveVariantIndex={setActiveVariantIndex}
              media={media}
              activeMedia={activeMedia}
              setActiveMediaIndex={setActiveMediaIndex}
            />
          ),
        }}
      />
      <Lyrics
        song={song}
        title={title}
        activeVariant={activeVariant}
        isTitleBehind={isTitleBehind}
        setIsTitleBehind={setIsTitleBehind}
      />
      {activeMedia ? <Player asset={activeMedia} onClose={() => setActiveMediaIndex(null)} /> : null}
    </Fragment>
  );
}
