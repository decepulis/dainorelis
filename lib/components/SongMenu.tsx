import { useTranslation } from 'react-i18next';

import { Stack, useRouter } from 'expo-router';

import Feedback from '@expo/material-symbols/feedback.xml';
import MenuBook from '@expo/material-symbols/menu_book.xml';
import MusicNote from '@expo/material-symbols/music_note.xml';
import Translate from '@expo/material-symbols/translate.xml';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

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
  const router = useRouter();
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const { value: showChords, setValue: setShowChords } = useStorage('showChords');
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const hasTranslation = Object.values(song.fields['Translations']).length > 0;

  // TODO share sheet (dainorelis.app web app)
  const actions: (MenuAction | null)[] = [
    hasDescriptions
      ? {
          id: 'info',
          title: t('aboutSong'),
          image: process.env.EXPO_OS === 'ios' ? 'book' : MenuBook,
        }
      : null,
    hasTranslation
      ? {
          id: 'translation',
          title: t('translateSong'),
          image: process.env.EXPO_OS === 'ios' ? 'translate' : Translate,
        }
      : null,
    hasChords
      ? {
          id: 'toggleChords',
          title: t('chords'),
          image: process.env.EXPO_OS === 'ios' ? 'guitars' : MusicNote,
          state: showChords ? 'on' : 'off',
        }
      : null,
    {
      id: 'feedback',
      title: t('feedback'),
      image: process.env.EXPO_OS === 'ios' ? 'exclamationmark.bubble' : Feedback,
    },
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
    }
  };

  return (
    <MenuView actions={filteredActions} onPressAction={onPressAction} accessibilityLabel={t('moreOptions')}>
      <SystemView shadow={false} style={[buttonStyles.button]}>
        {/* overflow menus are vertical dots on Android, horizontal on iOS */}
        <FontAwesome6
          name={process.env.EXPO_OS === 'android' ? 'ellipsis-vertical' : 'ellipsis'}
          iconStyle="solid"
          size={18}
          color="white"
        />
      </SystemView>
    </MenuView>
  );
}

type SongDetailToolbarProps = {
  isFavorite: boolean;
  onToggleFavorite: () => void;
};
// Liquid Glass: the heart is a bar button; the rest of the menu is UIKit's own overflow menu (useSongOverflowMenu)
export function SongDetailToolbar({ isFavorite, onToggleFavorite }: SongDetailToolbarProps) {
  const { t } = useTranslation();

  if (!isLiquidGlassStyleHeader()) return null;

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button icon={isFavorite ? 'heart.fill' : 'heart'} selected={isFavorite} onPress={onToggleFavorite}>
        {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
      </Stack.Toolbar.Button>
    </Stack.Toolbar>
  );
}

type OverflowMenuItem = { menuId: string; title: string; sfSymbolName: string; state?: 'on' | 'off' };

// Liquid Glass: the song's actions for UIKit's overflow menu, passed as the header config's overflowMenu (our
// react-native-screens patch), rather than a ⋯ menu of ours that UIKit would fold, with the heart, into a nested
// overflow menu when a long title leaves no room. The song screen pins the heart past UIKit's ⋯ (pinsTrailingItems)
export function useSongOverflowMenu(song: Song, hasChords: boolean) {
  const router = useRouter();
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const { value: showChords, setValue: setShowChords } = useStorage('showChords');
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const hasTranslation = Object.values(song.fields['Translations']).length > 0;

  const items: (OverflowMenuItem | null)[] = [
    hasDescriptions ? { menuId: 'info', title: t('aboutSong'), sfSymbolName: 'book' } : null,
    hasTranslation ? { menuId: 'translation', title: t('translateSong'), sfSymbolName: 'translate' } : null,
    hasChords
      ? { menuId: 'toggleChords', title: t('chords'), sfSymbolName: 'guitars', state: showChords ? 'on' : 'off' }
      : null,
    { menuId: 'feedback', title: t('feedback'), sfSymbolName: 'exclamationmark.bubble' },
  ];

  const onPressOverflowMenuItem = (e: { nativeEvent: { menuId: string } }) => {
    const { menuId } = e.nativeEvent;
    if (menuId === 'info') {
      router.push(`/dainos/${song.id}/aprasymas`);
    } else if (menuId === 'translation') {
      router.push(`/dainos/${song.id}/vertimas`);
    } else if (menuId === 'toggleChords') {
      setShowChords(!showChords);
    } else if (menuId === 'feedback') {
      openFeedback(song.fields.Name);
    }
  };

  return { overflowMenu: { items: items.filter(Boolean) }, onPressOverflowMenuItem };
}
