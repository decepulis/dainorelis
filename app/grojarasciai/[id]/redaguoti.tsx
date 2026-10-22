import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import ReorderableList, { reorderItems, useReorderableDrag } from 'react-native-reorderable-list';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';

import { Host, List, Text, VStack } from '@expo/ui/swift-ui';
import { environment, font, foregroundStyle } from '@expo/ui/swift-ui/modifiers';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import Button from '@/lib/components/Button';
import { HeaderBackground, HeaderLeft, HeaderTitle, isLiquidGlassStyleHeader } from '@/lib/components/Header';
import NotFound from '@/lib/components/NotFound';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import usePlaylists, { Playlist } from '@/lib/hooks/usePlaylists';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Song } from '@/lib/schemas/songs';
import { splitTitle } from '@/lib/utils/useTitle';
import songs from '@/songs';

const songsById = new Map(songs.map((song) => [song.id, song]));

/** SwiftUI's move: the items at `sourceIndices` go before what was at `destination` */
const moveItems = <T,>(items: T[], sourceIndices: number[], destination: number) => {
  const moved = sourceIndices.map((index) => items[index]);
  const isMoved = (index: number) => sourceIndices.includes(index);
  return [
    ...items.slice(0, destination).filter((_, index) => !isMoved(index)),
    ...moved,
    ...items.slice(destination).filter((_, index) => !isMoved(index + destination)),
  ];
};

export default function Page() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlaylist } = usePlaylists();
  const playlist = getPlaylist(id);
  if (!playlist || playlist.kind === 'curated') {
    return <NotFound modal message={t('pageNotFound')} />;
  }
  return <EditPlaylist playlist={playlist} />;
}

/**
 * Reorder and remove a playlist's songs. Changes apply as they're made, so Done only closes. iOS gets SwiftUI's own
 * List in edit mode; Android (and web) a reorderable list with drag handles.
 */
function EditPlaylist({ playlist }: { playlist: Playlist }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { setSongIds } = usePlaylists();

  // songs since removed from the songbook stay in the playlist, out of sight, in case they come back
  const playlistSongs = playlist.songIds.map((id) => songsById.get(id)).filter((song): song is Song => !!song);
  const unknownIds = playlist.songIds.filter((id) => !songsById.has(id));
  const save = (edited: Song[]) => setSongIds(playlist.id, [...edited.map((song) => song.id), ...unknownIds]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: isLiquidGlassStyleHeader()
            ? playlist.name
            : () => <HeaderTitle showTitle title={playlist.name} subtitle={t('editPlaylist')} />,
          headerLeft: !isLiquidGlassStyleHeader() ? (props) => <HeaderLeft {...props} modal /> : undefined,
          headerBackground: () => <HeaderBackground opaque />,
        }}
      />
      {isLiquidGlassStyleHeader() ? (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            icon="checkmark"
            variant="done"
            accessibilityLabel={t('done')}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        </Stack.Toolbar>
      ) : null}
      {process.env.EXPO_OS === 'ios' ? (
        <SwiftUIEditList
          songs={playlistSongs}
          onMove={(sourceIndices, destination) => save(moveItems(playlistSongs, sourceIndices, destination))}
          onDelete={(indices) => save(playlistSongs.filter((_, index) => !indices.includes(index)))}
        />
      ) : (
        <ReorderableEditList
          songs={playlistSongs}
          onReorder={(from, to) => save(reorderItems(playlistSongs, from, to))}
          onRemove={(songId) => save(playlistSongs.filter((song) => song.id !== songId))}
        />
      )}
    </>
  );
}

type SwiftUIEditListProps = {
  songs: Song[];
  onMove: (sourceIndices: number[], destination: number) => void;
  onDelete: (indices: number[]) => void;
};
/** a SwiftUI List, always in edit mode: delete buttons, drag handles and swipe to delete */
function SwiftUIEditList({ songs, onMove, onDelete }: SwiftUIEditListProps) {
  const colorScheme = useColorScheme();
  return (
    <Host style={{ flex: 1 }} colorScheme={colorScheme}>
      <List modifiers={[environment({ key: 'editMode', value: 'active' })]}>
        <List.ForEach data={songs} keyExtractor={(song) => song.id} onMove={onMove} onDelete={onDelete}>
          {({ item }) => <SwiftUISongRow song={item} />}
        </List.ForEach>
      </List>
    </Host>
  );
}

function SwiftUISongRow({ song }: { song: Song }) {
  const [title, subtitle] = splitTitle(song.fields.Name);
  return (
    <VStack alignment="leading" spacing={2}>
      <Text>{title}</Text>
      {subtitle ? (
        <Text
          modifiers={[
            font({ textStyle: 'subheadline' }),
            foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}

type ReorderableEditListProps = {
  songs: Song[];
  onReorder: (from: number, to: number) => void;
  onRemove: (songId: string) => void;
};
function ReorderableEditList({ songs, onReorder, onRemove }: ReorderableEditListProps) {
  const headerHeight = useHeaderHeight();
  const inset = useSafeAreaInsets();
  const background = useThemeColor('background');
  return (
    <ReorderableList
      data={songs}
      keyExtractor={(song) => song.id}
      onReorder={({ from, to }) => onReorder(from, to)}
      renderItem={({ item, index }) => (
        <ReorderableSongRow
          song={item}
          onRemove={() => onRemove(item.id)}
          // screen readers move a row a step at a time
          onMoveBy={(delta) => {
            const to = index + delta;
            if (to >= 0 && to < songs.length) onReorder(index, to);
          }}
        />
      )}
      style={{ backgroundColor: background }}
      contentContainerStyle={{
        paddingTop: headerHeight + padding / 2,
        paddingBottom: inset.bottom + padding,
        paddingLeft: inset.left,
        paddingRight: inset.right,
      }}
    />
  );
}

type ReorderableSongRowProps = { song: Song; onRemove: () => void; onMoveBy: (delta: number) => void };
function ReorderableSongRow({ song, onRemove, onMoveBy }: ReorderableSongRowProps) {
  const { t } = useTranslation();
  const drag = useReorderableDrag();
  const text = useThemeColor('text');
  const background = useThemeColor('background');
  const separator = useThemeColor('separator');
  const [title, subtitle] = splitTitle(song.fields.Name);

  return (
    <View style={[styles.row, { backgroundColor: background, borderBottomColor: separator }]}>
      <Button
        noGlass
        onPress={onRemove}
        accessibilityLabel={`${t('removeFromPlaylist')}: ${title}`}
        innerStyle={styles.removeButton}
      >
        <FontAwesome6 name="circle-minus" iconStyle="solid" size={20} color="#d93025" />
      </Button>
      <Pressable onLongPress={drag} style={styles.rowText} accessible={false}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </Pressable>
      <Pressable
        onPressIn={drag}
        hitSlop={padding / 2}
        accessibilityLabel={`${t('reorder')}: ${title}`}
        accessibilityActions={[
          { name: 'moveUp', label: t('moveUp') },
          { name: 'moveDown', label: t('moveDown') },
        ]}
        onAccessibilityAction={({ nativeEvent }) => onMoveBy(nativeEvent.actionName === 'moveUp' ? -1 : 1)}
        style={styles.dragHandle}
      >
        <FontAwesome6 name="grip-lines" iconStyle="solid" size={18} color={text} style={{ opacity: 0.6 }} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding / 2,
    minHeight: 56,
    paddingLeft: padding / 2,
    paddingRight: padding / 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  removeButton: {
    backgroundColor: 'transparent',
  },
  rowText: {
    flex: 1,
    paddingVertical: padding / 2,
  },
  title: {
    fontSize: 18,
    lineHeight: 18 * 1.33,
  },
  subtitle: {
    opacity: 0.75,
  },
  dragHandle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
