import { useTranslation } from 'react-i18next';

import { clampPlaylistName, playlistNameMaxLength } from '@/lib/constants/playlistName';
import songFestival from '@/song-festival';
import songs from '@/songs';

import useStorage from './useStorage';

/**
 * - favorites: every device has one; it can be edited but not renamed or deleted
 * - curated: ships with the app (read-only, in programme order, updated with app releases)
 * - user: created, renamed, edited and deleted by the user
 */
export type PlaylistKind = 'favorites' | 'curated' | 'user';
export type Playlist = {
  id: string;
  kind: PlaylistKind;
  name: string;
  songIds: string[];
  /** curated playlists keep their programme's parts */
  sections?: { title: string; songIds: string[] }[];
};

export const allSongsId = 'all';
export const favoritesId = 'favorites';

// song-festival.ts lists the programme as indices into songs.ts (both are generated together)
const songFestivalSections = songFestival.map((part) => ({
  titleKey: part.title,
  songIds: part.data.map((index) => songs[index]?.id).filter((id): id is string => !!id),
}));

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
// a song is in a playlist once (the list's rows are keyed by song id)
const unique = (songIds: string[]) => [...new Set(songIds)];

export default function usePlaylists() {
  const { t } = useTranslation();
  const { value: favoriteIds, setValue: setFavoriteIds } = useStorage('favorites');
  const { value: userPlaylists, setValue: setUserPlaylists } = useStorage('playlists');

  const favorites: Playlist = {
    id: favoritesId,
    kind: 'favorites',
    name: t('favoriteSongs'),
    songIds: unique(favoriteIds),
  };
  const curated: Playlist[] = [
    {
      id: 'songFestival',
      kind: 'curated',
      name: t('songFestival'),
      songIds: songFestivalSections.flatMap((section) => section.songIds),
      sections: songFestivalSections.map((section) => ({ title: t(section.titleKey), songIds: section.songIds })),
    },
  ];
  const user: Playlist[] = userPlaylists.map((playlist) => ({
    ...playlist,
    kind: 'user',
    songIds: unique(playlist.songIds),
  }));
  const playlists = [favorites, ...curated, ...user];

  const getPlaylist = (id: string) => playlists.find((playlist) => playlist.id === id);

  /**
   * trimmed, cut to the longest name, and made unique among the playlists' names with a " (2)" suffix (cutting the
   * name further to make room)
   */
  const uniqueName = (name: string, exceptId?: string) => {
    const base = clampPlaylistName(name.trim());
    const taken = new Set(playlists.filter((p) => p.id !== exceptId).map((p) => p.name.toLocaleLowerCase()));
    let candidate = base;
    for (let n = 2; taken.has(candidate.toLocaleLowerCase()); n++) {
      const suffix = ` (${n})`;
      candidate = `${clampPlaylistName(base, playlistNameMaxLength - suffix.length).trimEnd()}${suffix}`;
    }
    return candidate;
  };

  // the updates below apply to the stored lists as they are when they run, so two in a row (e.g. quick toggles,
  // before React re-renders) both land

  /** returns the new playlist's id, or null for a blank name */
  const createPlaylist = (name: string, songIds: string[] = []) => {
    if (!name.trim()) return null;
    const id = newId();
    const playlist = { id, name: uniqueName(name), songIds: unique(songIds) };
    setUserPlaylists((current) => [...current, playlist]);
    return id;
  };

  const renamePlaylist = (id: string, name: string) => {
    if (!name.trim()) return;
    const newName = uniqueName(name, id);
    setUserPlaylists((current) => current.map((p) => (p.id === id ? { ...p, name: newName } : p)));
  };

  const deletePlaylist = (id: string) => {
    setUserPlaylists((current) => current.filter((p) => p.id !== id));
  };

  /** changes a favorites or user playlist's songs (curated playlists are read-only) */
  const updateSongIds = (id: string, update: (songIds: string[]) => string[]) => {
    if (id === favoritesId) {
      setFavoriteIds((current) => unique(update(unique(current))));
    } else {
      setUserPlaylists((current) =>
        current.map((p) => (p.id === id ? { ...p, songIds: unique(update(unique(p.songIds))) } : p))
      );
    }
  };

  /** replaces a favorites or user playlist's songs */
  const setSongIds = (id: string, songIds: string[]) => updateSongIds(id, () => songIds);

  /** adds the song at the end, or removes it; returns whether it's now in the playlist */
  const toggleSong = (id: string, songId: string) => {
    if (id !== favoritesId && !userPlaylists.some((p) => p.id === id)) return false;
    let isIn = false;
    updateSongIds(id, (songIds) => {
      isIn = songIds.includes(songId);
      return isIn ? songIds.filter((s) => s !== songId) : [...songIds, songId];
    });
    return !isIn;
  };

  return {
    playlists,
    favorites,
    curated,
    user,
    /** the playlists a song can be added to */
    editable: [favorites, ...user],
    getPlaylist,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    setSongIds,
    toggleSong,
  };
}
