import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useColorScheme } from '@/lib/hooks/useColorScheme';

import { Stack, router } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { Song } from '@/lib/schemas/songs';

import useOpenFeedback from '../hooks/useOpenFeedback';
import useStorage from '../hooks/useStorage';
import { styles as buttonStyles } from './Button';
import { isLiquidGlassStyleHeader } from './Header';
import MenuView from './MenuView';
import SystemView from './SystemView';

type Props = {
  song: Song;
  hasChords: boolean;
};
export default function SongMenu({ song, hasChords }: Props) {
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const { value: showChords, setValue: setShowChords } = useStorage('showChords');
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const hasTranslation = Object.values(song.fields['Translations']).length > 0;
  const isDark = useColorScheme() === 'dark';

  // TODO share sheet (dainorelis.app web app)
  const actions: (MenuAction | null)[] = [
    hasDescriptions
      ? {
          id: 'info',
          title: t('aboutSong'),
          imageColor: isDark ? 'white' : 'black',
          image: Platform.select({
            ios: 'book',
            default: 'menu_book_20px',
          }),
        }
      : null,
    hasTranslation
      ? {
          id: 'translation',
          title: t('translateSong'),
          imageColor: isDark ? 'white' : 'black',
          image: Platform.select({
            ios: 'translate',
            default: 'translate_20px',
          }),
        }
      : null,
    hasChords
      ? {
          id: 'toggleChords',
          title: t('chords'),
          imageColor: isDark ? 'white' : 'black',
          image: Platform.select({
            ios: 'guitars',
            default: 'music_note_20px',
          }),
          state: showChords ? 'on' : 'off',
        }
      : null,
    {
      id: 'feedback',
      title: t('feedback'),
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: 'exclamationmark.bubble',
        default: 'feedback_20px',
      }),
    },
    // {
    //   id: 'share',
    //   title: t('shareSong'),
    //   imageColor: isDark ? 'white' : 'black',
    //   image: Platform.select({
    //     ios: 'square.and.arrow.up',
    //     default: 'share_20px',
    //   }),
    //   attributes: { disabled: true },
    // },
  ];
  const filteredActions = actions.filter(Boolean) as MenuAction[];

  const onPressAction = (e: NativeActionEvent) => {
    const { event } = e.nativeEvent;
    if (event === 'info') {
      router.push(`/dainos/${song.id}/aprasymas`);
    } else if (event === 'translation') {
      router.push(`/dainos/${song.id}/vertimas`);
    } else if (event === 'toggleChords') {
      setShowChords(!showChords);
    } else if (event === 'feedback') {
      openFeedback(song.fields.Name);
    } else if (event === 'share') {
      console.log('share');
    }
  };

  return (
    <MenuView actions={filteredActions} onPressAction={onPressAction}>
      <SystemView shadow={false} style={[buttonStyles.button]}>
        <FontAwesome6 name="ellipsis" size={18} color="white" />
      </SystemView>
    </MenuView>
  );
}

type SongDetailToolbarProps = {
  song: Song;
  hasChords: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};
export function SongDetailToolbar({ song, hasChords, isFavorite, onToggleFavorite }: SongDetailToolbarProps) {
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const { value: showChords, setValue: setShowChords } = useStorage('showChords');
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const hasTranslation = Object.values(song.fields['Translations']).length > 0;

  if (!isLiquidGlassStyleHeader()) return null;

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="chevron.left" onPress={() => router.navigate('../')} />
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon={isFavorite ? 'heart.fill' : 'heart'}
          selected={isFavorite}
          onPress={onToggleFavorite}
        >
          {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
        </Stack.Toolbar.Button>
        <Stack.Toolbar.Menu icon="ellipsis">
          {hasDescriptions ? (
            <Stack.Toolbar.MenuAction icon="book" onPress={() => router.push(`/dainos/${song.id}/aprasymas`)}>
              {t('aboutSong')}
            </Stack.Toolbar.MenuAction>
          ) : null}
          {hasTranslation ? (
            <Stack.Toolbar.MenuAction icon="translate" onPress={() => router.push(`/dainos/${song.id}/vertimas`)}>
              {t('translateSong')}
            </Stack.Toolbar.MenuAction>
          ) : null}
          {hasChords ? (
            <Stack.Toolbar.MenuAction icon="guitars" isOn={showChords} onPress={() => setShowChords(!showChords)}>
              {t('chords')}
            </Stack.Toolbar.MenuAction>
          ) : null}
          <Stack.Toolbar.MenuAction icon="exclamationmark.bubble" onPress={() => openFeedback(song.fields.Name)}>
            {t('feedback')}
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
    </>
  );
}
