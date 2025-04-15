import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu';

import useStorage from '@/lib/hooks/useStorage';
import { Audio } from '@/lib/schemas/audio';
import { Lyrics } from '@/lib/schemas/lyrics';
import { PDFs } from '@/lib/schemas/pdfs';
import { Song } from '@/lib/schemas/songs';
import { Videos } from '@/lib/schemas/videos';
import isLyrics from '@/lib/utils/isLyrics';

import Button, { styles as buttonStyles } from '../Button';
import SystemView from '../SystemView';

type Props = {
  song: Song;
  variants: (Lyrics | PDFs)[];
  activeVariant: Lyrics | PDFs;
  setActiveVariantIndex: (v: number) => void;
  media: (Audio | Videos)[];
  activeMedia: Audio | Videos | null;
  setActiveMediaIndex: (v: number | null) => void;
};
export default function SongMenu({
  song,
  variants,
  activeVariant,
  setActiveVariantIndex,
  media,
  activeMedia,
  setActiveMediaIndex,
}: Props) {
  const { t } = useTranslation();

  const { value: showChords, setValue: setShowChords, loading: showChordsLoading } = useStorage('showChords');

  const hasChords = activeVariant ? isLyrics(activeVariant) && !!activeVariant['Show Chords'] : null;
  const hasLyrics = Array.isArray(song.fields.Lyrics) && song.fields.Lyrics.length > 1;
  const hasVideos = Array.isArray(song.fields.Videos) && song.fields.Videos.length > 0;
  const hasAudio = Array.isArray(song.fields.Audio) && song.fields.Audio.length > 0;
  const hasPDFs = Array.isArray(song.fields.PDFs) && song.fields.PDFs.length > 0;
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];

  const { value: favorites, setValue: setFavorites, loading: favoritesLoading } = useStorage('favorites');
  const isFavorite = favorites.includes(song.id);

  const addToFavorites = useCallback(() => {
    if (!favoritesLoading) {
      setFavorites([...favorites, song.id]);
    }
  }, [favoritesLoading, favorites, setFavorites, song.id]);
  const removeFromFavorites = useCallback(() => {
    if (!favoritesLoading) {
      setFavorites(favorites.filter((id) => id !== song.id));
    }
  }, [favoritesLoading, favorites, setFavorites, song.id]);

  const actions: (MenuAction | null)[] = [
    hasChords
      ? {
          id: 'chords',
          title: t('showChords'),
          state: showChords ? 'on' : 'off',
        }
      : null,
    hasLyrics || hasPDFs
      ? {
          id: 'variants',
          title: t('variantsMenuTitle'),
          subactions: variants.map((v, idx) => ({
            id: `variants-${idx.toString()}`,
            title: v['Variant Name'],
            state: (v === activeVariant ? 'on' : 'off') as 'off' | 'on',
          })),
        }
      : null,
    hasAudio || hasVideos
      ? {
          id: 'recordings',
          title: t('mediaMenuTitle'),
          subactions: media.map((m, idx) => ({
            id: `recordings-${idx.toString()}`,
            title: m['Variant Name'],
            state: (m === activeMedia ? 'on' : 'off') as 'off' | 'on',
          })),
        }
      : null,
    hasDescriptions ? { id: 'info', title: 'Information' } : null,
  ];
  const filteredActions = actions.filter(Boolean) as MenuAction[];

  const onPressAction = useCallback(
    (e: NativeActionEvent) => {
      const { event } = e.nativeEvent;
      const [id, subId] = event.split('-');
      if (id === 'chords') {
        setShowChords(!showChords);
      } else if (id === 'variants') {
        setActiveVariantIndex(Number(subId));
      } else if (id === 'recordings') {
        setActiveMediaIndex(Number(subId));
      } else if (id === 'info') {
        console.log('info');
      }
    },
    [setShowChords, showChords, setActiveVariantIndex, setActiveMediaIndex]
  );

  return (
    <>
      {filteredActions.length ? (
        <MenuView
          hitSlop={{ top: 28, bottom: 28, left: 28, right: 28 }}
          actions={filteredActions}
          onPressAction={onPressAction}
        >
          <SystemView variant="primary" shadow={false} style={buttonStyles.container}>
            <FontAwesome6 name="bars" size={14} color="white" />
          </SystemView>
        </MenuView>
      ) : null}
      <Button onPress={isFavorite ? removeFromFavorites : addToFavorites}>
        <FontAwesome6 name="heart" solid={isFavorite} size={14} color="white" />
      </Button>
    </>
  );
}
