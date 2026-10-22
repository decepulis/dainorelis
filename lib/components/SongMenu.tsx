import { useTranslation } from 'react-i18next';

import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';

import Feedback from '@expo/material-symbols/feedback.xml';
import MenuBook from '@expo/material-symbols/menu_book.xml';
import MusicNote from '@expo/material-symbols/music_note.xml';
import Translate from '@expo/material-symbols/translate.xml';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import { Song } from '@/lib/schemas/songs';

import useNamePrompt from '../hooks/useNamePrompt';
import useOpenFeedback from '../hooks/useOpenFeedback';
import { createPlaylistIcon } from '../hooks/usePlaylistActions';
import usePlaylists, { Playlist } from '../hooks/usePlaylists';
import useStorage from '../hooks/useStorage';
import { useThemeColor } from '../hooks/useThemeColor';
import { styles as buttonStyles } from './Button';
import { isLiquidGlassStyleHeader } from './Header';
import MenuView, { type MenuAction as MenuViewAction } from './MenuView';
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

/**
 * Membership of a song in the playlists it can be added to (Favorites and the user's), for the song screen's
 * Add to Playlist menu. Render `namePrompt`.
 */
export function useAddToPlaylist(song: Song) {
  const { t } = useTranslation();
  const { editable, toggleSong, createPlaylist } = usePlaylists();
  const { promptName, namePrompt } = useNamePrompt();

  const isInAny = editable.some((playlist) => playlist.songIds.includes(song.id));
  const toggle = (playlistId: string) => {
    const isIn = toggleSong(playlistId, song.id);
    Haptics.impactAsync(isIn ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Soft);
  };
  const promptNewPlaylist = () =>
    promptName({
      title: t('newPlaylist'),
      message: t('newPlaylistMessage'),
      confirmLabel: t('create'),
      onSubmit: (name) => {
        createPlaylist(name, [song.id]);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      },
    });

  return { playlists: editable, isInAny, toggle, promptNewPlaylist, namePrompt };
}

const newPlaylistId = 'newPlaylist';

/** The custom header's Add to Playlist button (Android, iOS 18) */
export function AddToPlaylistMenu({ song }: { song: Song }) {
  const { t } = useTranslation();
  const { playlists, isInAny, toggle, promptNewPlaylist, namePrompt } = useAddToPlaylist(song);
  const [favorites, ...user] = playlists;
  const playlistAction = (playlist: Playlist): MenuViewAction => ({
    id: playlist.id,
    title: playlist.name,
    state: playlist.songIds.includes(song.id) ? 'on' : 'off',
  });

  return (
    <>
      <MenuView
        accessibilityLabel={t('addToPlaylist')}
        actions={[
          playlistAction(favorites),
          ...(user.length
            ? [{ id: 'user', title: '', displayInline: true, subactions: user.map(playlistAction) }]
            : []),
          {
            id: newPlaylistId,
            title: t('createPlaylist'),
            image: process.env.EXPO_OS === 'ios' ? createPlaylistIcon.sfSymbol : createPlaylistIcon.material,
          },
        ]}
        onPressAction={({ nativeEvent }) =>
          nativeEvent.event === newPlaylistId ? promptNewPlaylist() : toggle(nativeEvent.event)
        }
      >
        <SystemView shadow={false} style={[buttonStyles.button]}>
          <FontAwesome6 name={isInAny ? 'list-check' : 'list-ul'} iconStyle="solid" size={16} color="white" />
        </SystemView>
      </MenuView>
      {namePrompt}
    </>
  );
}

// Liquid Glass: Add to Playlist is a bar button menu; the rest of the song's menu is UIKit's own overflow menu
// (useSongOverflowMenu)
export function SongDetailToolbar({ song }: { song: Song }) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const { playlists, isInAny, toggle, promptNewPlaylist, namePrompt } = useAddToPlaylist(song);
  const [favorites, ...user] = playlists;

  if (!isLiquidGlassStyleHeader()) return null;

  const playlistAction = (playlist: Playlist) => (
    <Stack.Toolbar.MenuAction
      key={playlist.id}
      isOn={playlist.songIds.includes(song.id)}
      onPress={() => toggle(playlist.id)}
    >
      {playlist.name}
    </Stack.Toolbar.MenuAction>
  );

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu
          icon={isInAny ? 'text.badge.checkmark' : 'text.badge.plus'}
          tintColor={isInAny ? primary : undefined}
          title={t('addToPlaylist')}
          accessibilityLabel={t('addToPlaylist')}
        >
          {playlistAction(favorites)}
          {user.length ? <Stack.Toolbar.Menu inline>{user.map(playlistAction)}</Stack.Toolbar.Menu> : null}
          <Stack.Toolbar.Menu inline>
            <Stack.Toolbar.MenuAction icon={createPlaylistIcon.sfSymbol} onPress={promptNewPlaylist}>
              {t('createPlaylist')}
            </Stack.Toolbar.MenuAction>
          </Stack.Toolbar.Menu>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      {namePrompt}
    </>
  );
}

type OverflowMenuItem = { menuId: string; title: string; sfSymbolName: string; state?: 'on' | 'off' };

// Liquid Glass: the song's actions for UIKit's overflow menu, passed as the header config's overflowMenu (our
// react-native-screens patch), rather than a ⋯ menu of ours that UIKit would fold, with Add to Playlist, into a nested
// overflow menu when a long title leaves no room. The song screen pins Add to Playlist past UIKit's ⋯ (pinsTrailingItems)
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
