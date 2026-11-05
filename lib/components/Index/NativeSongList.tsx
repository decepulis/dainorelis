import type { Ref } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import type { ListRef } from '@expo/ui/swift-ui';

import type { Song } from '@/lib/schemas/songs';

import type { RowPlaylist } from './ListItem';

/** a run of rows under an optional header: a letter in all songs, a programme section in a curated playlist */
export type NativeSongListSection = {
  key: string;
  /** the sticky header, if shown */
  title?: string;
  /** the section's label in the side index (iOS 26+), if the list has one */
  indexLabel?: string;
  songs: Song[];
};

export type NativeSongListProps = {
  ref?: Ref<ListRef>;
  sections: NativeSongListSection[];
  /** above the rows, scrolling with them: the forest and the logo (React Native, hosted in the list) */
  header: React.ReactElement;
  headerHeight: number;
  /** under the header on Liquid Glass, which has no pill to name the playlist */
  playlistTitle?: string;
  /** below the rows (React Native, hosted in the list) */
  footer: React.ReactElement;
  width: number;
  /** the rows' leading and trailing padding, clear of the horizontal safe area and centred in a wide window */
  rowInsets: { leading: number; trailing: number };
  /** set on the UI thread as the list scrolls, for the header's scroll effects */
  scrollOffset: SharedValue<number>;
  /** Favorites or a user playlist (not a search): holding a row lifts it to be dragged, as in Reminders */
  onMove?: (from: number, to: number) => void;
  favoriteIds: Set<string>;
  userPlaylists: RowPlaylist[];
  /** usePlaylists' toggleSong */
  toggleSong: (playlistId: string, songId: string) => boolean;
  /** the user playlist the list shows, if any: its rows offer Remove instead of Add to playlist */
  shownUserPlaylistId?: string;
  onNewPlaylistWithSong: (songId: string) => void;
};

/**
 * The home screen's list as a SwiftUI List: native swipe actions, context menus, reordering and (iOS 26+) the side
 * index. iOS only; elsewhere the home screen keeps its React Native list.
 */
export default function NativeSongList(_props: NativeSongListProps): React.ReactElement | null {
  return null;
}
