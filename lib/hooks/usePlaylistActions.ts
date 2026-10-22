import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useRouter } from 'expo-router';

import Add from '@expo/material-symbols/add.xml';
import ContentCopy from '@expo/material-symbols/content_copy.xml';
import Delete from '@expo/material-symbols/delete.xml';
import Share from '@expo/material-symbols/share.xml';
import Reorder from '@expo/material-symbols/swap_vert.xml';
import Title from '@expo/material-symbols/title.xml';
import type { SFSymbol } from 'sf-symbols-typescript';

import useNamePrompt from './useNamePrompt';
import usePlaylists, { Playlist, allSongsId } from './usePlaylists';
import useStorage from './useStorage';

export type PlaylistActionId = 'edit' | 'rename' | 'share' | 'duplicate' | 'delete';
export type PlaylistAction = {
  id: PlaylistActionId;
  title: string;
  sfSymbol: SFSymbol;
  /** a Material Symbol for Android menus */
  material: number;
  destructive?: boolean;
};

export const createPlaylistIcon = {
  sfSymbol: 'plus' as SFSymbol,
  material: Add,
};

/**
 * The home screen's playlist state and what can be done with the shown playlist: Favorites can be edited
 * and shared, a curated playlist shared and duplicated, a user playlist all of it. Render `namePrompt`.
 */
export default function usePlaylistActions() {
  const router = useRouter();
  const { t } = useTranslation();
  const { promptName, namePrompt } = useNamePrompt();
  const { getPlaylist, createPlaylist, renamePlaylist, deletePlaylist } = usePlaylists();
  const { value: selectedPlaylistId, setValue: setSelectedPlaylistId } = useStorage('selectedPlaylistId');
  // a deleted playlist (or a curated one a release retired) falls back to all songs
  const playlist: Playlist | null = getPlaylist(selectedPlaylistId) ?? null;

  const kind = playlist?.kind;
  const actions: PlaylistAction[] = [
    kind === 'favorites' || kind === 'user'
      ? { id: 'edit' as const, title: t('editPlaylist'), sfSymbol: 'arrow.up.arrow.down' as const, material: Reorder }
      : null,
    kind === 'user'
      ? {
          id: 'rename' as const,
          title: t('renamePlaylist'),
          sfSymbol: 'character.cursor.ibeam' as const,
          material: Title,
        }
      : null,
    playlist
      ? { id: 'share' as const, title: t('sharePlaylist'), sfSymbol: 'square.and.arrow.up' as const, material: Share }
      : null,
    kind === 'curated'
      ? {
          id: 'duplicate' as const,
          title: t('duplicatePlaylist'),
          sfSymbol: 'plus.square.on.square' as const,
          material: ContentCopy,
        }
      : null,
    kind === 'user'
      ? {
          id: 'delete' as const,
          title: t('deletePlaylist'),
          sfSymbol: 'trash' as const,
          material: Delete,
          destructive: true,
        }
      : null,
  ].filter((action) => action !== null);

  const onAction = (id: PlaylistActionId) => {
    if (!playlist) return;
    if (id === 'edit') {
      router.push(`/grojarasciai/${playlist.id}/redaguoti`);
    } else if (id === 'share') {
      router.push(`/grojarasciai/${playlist.id}/bendrinti`);
    } else if (id === 'rename') {
      promptName({
        title: t('renamePlaylist'),
        defaultValue: playlist.name,
        confirmLabel: t('save'),
        onSubmit: (name) => renamePlaylist(playlist.id, name),
      });
    } else if (id === 'duplicate') {
      const newId = createPlaylist(playlist.name, playlist.songIds);
      if (newId) setSelectedPlaylistId(newId);
    } else if (id === 'delete') {
      const title = t('deletePlaylistTitle', { name: playlist.name });
      const remove = () => {
        setSelectedPlaylistId(allSongsId);
        deletePlaylist(playlist.id);
      };
      // react-native-web's Alert does nothing
      if (process.env.EXPO_OS === 'web') {
        if (window.confirm(`${title}\n${t('deletePlaylistMessage')}`)) remove();
        return;
      }
      Alert.alert(title, t('deletePlaylistMessage'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('deletePlaylist'), style: 'destructive', onPress: remove },
      ]);
    }
  };

  const promptCreatePlaylist = () =>
    promptName({
      title: t('newPlaylist'),
      message: t('newPlaylistMessage'),
      confirmLabel: t('create'),
      onSubmit: (name) => {
        const newId = createPlaylist(name);
        if (newId) setSelectedPlaylistId(newId);
      },
    });

  return {
    playlist,
    selectedPlaylistId: playlist?.id ?? allSongsId,
    setSelectedPlaylistId,
    actions,
    onAction,
    promptCreatePlaylist,
    namePrompt,
  };
}
