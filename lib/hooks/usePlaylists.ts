import { useTranslation } from 'react-i18next';

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

export default function usePlaylists() {
  const { t } = useTranslation();
  const { value: favoriteIds, setValue: setFavoriteIds } = useStorage('favorites');
  const { value: userPlaylists, setValue: setUserPlaylists } = useStorage('playlists');

  const favorites: Playlist = { id: favoritesId, kind: 'favorites', name: t('favoriteSongs'), songIds: favoriteIds };
  const curated: Playlist[] = [
    {
      id: 'songFestival',
      kind: 'curated',
      name: t('songFestival'),
      songIds: songFestivalSections.flatMap((section) => section.songIds),
      sections: songFestivalSections.map((section) => ({ title: t(section.titleKey), songIds: section.songIds })),
    },
  ];
  const user: Playlist[] = userPlaylists.map((playlist) => ({ ...playlist, kind: 'user' }));
  const playlists = [favorites, ...curated, ...user];

  const getPlaylist = (id: string) => playlists.find((playlist) => playlist.id === id);

  /** trimmed, and made unique among the playlists' names with a " (2)" suffix */
  const uniqueName = (name: string, exceptId?: string) => {
    const base = name.trim();
    const taken = new Set(playlists.filter((p) => p.id !== exceptId).map((p) => p.name.toLocaleLowerCase()));
    let candidate = base;
    for (let n = 2; taken.has(candidate.toLocaleLowerCase()); n++) {
      candidate = `${base} (${n})`;
    }
    return candidate;
  };

  /** returns the new playlist's id, or null for a blank name */
  const createPlaylist = (name: string, songIds: string[] = []) => {
    if (!name.trim()) return null;
    const id = newId();
    setUserPlaylists([...userPlaylists, { id, name: uniqueName(name), songIds: [...new Set(songIds)] }]);
    return id;
  };

  const renamePlaylist = (id: string, name: string) => {
    if (!name.trim()) return;
    setUserPlaylists(userPlaylists.map((p) => (p.id === id ? { ...p, name: uniqueName(name, id) } : p)));
  };

  const deletePlaylist = (id: string) => {
    setUserPlaylists(userPlaylists.filter((p) => p.id !== id));
  };

  /** replaces a favorites or user playlist's songs (curated playlists are read-only) */
  const setSongIds = (id: string, songIds: string[]) => {
    if (id === favoritesId) {
      setFavoriteIds(songIds);
    } else {
      setUserPlaylists(userPlaylists.map((p) => (p.id === id ? { ...p, songIds } : p)));
    }
  };

  /** adds the song at the end, or removes it; returns whether it's now in the playlist */
  const toggleSong = (id: string, songId: string) => {
    const playlist = getPlaylist(id);
    if (!playlist || playlist.kind === 'curated') return false;
    const isIn = playlist.songIds.includes(songId);
    setSongIds(id, isIn ? playlist.songIds.filter((s) => s !== songId) : [...playlist.songIds, songId]);
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
    uniqueName,
    createPlaylist,
    renamePlaylist,
    deletePlaylist,
    setSongIds,
    toggleSong,
  };
}
