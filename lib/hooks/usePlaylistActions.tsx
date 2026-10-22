import { useTranslation } from 'react-i18next';

import { useRouter } from 'expo-router';

import Add from '@expo/material-symbols/add.xml';
import ContentCopy from '@expo/material-symbols/content_copy.xml';
import Delete from '@expo/material-symbols/delete.xml';
import Share from '@expo/material-symbols/share.xml';
import Title from '@expo/material-symbols/title.xml';
import type { SFSymbol } from 'sf-symbols-typescript';

import useConfirm from './useConfirm';
import useNamePrompt from './useNamePrompt';
import usePlaylists, { Playlist, allSongsId } from './usePlaylists';
import useStorage from './useStorage';

export type PlaylistActionId = 'rename' | 'share' | 'duplicate' | 'delete';
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
 * The home screen's playlist state and what can be done with the shown playlist: Favorites can be shared, a curated playlist shared and duplicated, a user playlist all of it. Render `dialogs`.
 */
export default function usePlaylistActions() {
  const router = useRouter();
  const { t } = useTranslation();
  const { promptName, namePrompt } = useNamePrompt();
  const { confirm, confirmDialog } = useConfirm();
  const { getPlaylist, createPlaylist, renamePlaylist, deletePlaylist } = usePlaylists();
  const { value: selectedPlaylistId, setValue: setSelectedPlaylistId } = useStorage('selectedPlaylistId');
  // a deleted playlist (or a curated one a release retired) falls back to all songs
  const playlist: Playlist | null = getPlaylist(selectedPlaylistId) ?? null;

  const kind = playlist?.kind;
  const actions: PlaylistAction[] = [
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
    kind === 'curated' || kind === 'user'
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
    if (id === 'share') {
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
      confirm({
        title: t('deletePlaylistTitle', { name: playlist.name }),
        message: t('deletePlaylistMessage'),
        confirmLabel: t('deletePlaylist'),
        destructive: true,
        onConfirm: () => {
          setSelectedPlaylistId(allSongsId);
          deletePlaylist(playlist.id);
        },
      });
    }
  };

  // with songIds (adding a song from a list row) the new playlist gets them and the list stays put;
  // without, it's empty and shown
  const promptCreatePlaylist = (songIds?: string[]) =>
    promptName({
      title: t('newPlaylist'),
      message: t('newPlaylistMessage'),
      confirmLabel: t('create'),
      onSubmit: (name) => {
        const newId = createPlaylist(name, songIds);
        if (newId && !songIds) setSelectedPlaylistId(newId);
      },
    });

  return {
    playlist,
    selectedPlaylistId: playlist?.id ?? allSongsId,
    setSelectedPlaylistId,
    actions,
    onAction,
    promptCreatePlaylist,
    /** the name prompt's and the delete confirmation's dialogs, where a platform renders them */
    dialogs: (
      <>
        {namePrompt}
        {confirmDialog}
      </>
    ),
  };
}
