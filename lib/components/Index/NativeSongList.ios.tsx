import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRouter } from 'expo-router';

import {
  Button,
  ContextMenu,
  Group,
  HStack,
  Host,
  Image,
  Label,
  List,
  Menu,
  RNHostView,
  Section,
  Spacer,
  SwipeActions,
  Text,
  Toggle,
  VStack,
} from '@expo/ui/swift-ui';
import {
  background as backgroundModifier,
  createModifier,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  listRowBackground,
  listRowInsets,
  listRowSeparator,
  listStyle,
  padding as paddingModifier,
  tint,
  useScrollGeometryChange,
} from '@expo/ui/swift-ui/modifiers';

import padding from '@/lib/constants/padding';
import { createPlaylistIcon } from '@/lib/hooks/usePlaylistActions';
import { favoritesId } from '@/lib/hooks/usePlaylists';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import type { Song } from '@/lib/schemas/songs';
import haptic from '@/lib/utils/haptic';
import isLyrics from '@/lib/utils/isLyrics';
import useTitle from '@/lib/utils/useTitle';
import withAlpha from '@/lib/utils/withAlpha';

import type { RowPlaylist } from './ListItem';
import type { NativeSongListProps } from './NativeSongList';

// iOS 26's side index (patches/@expo__ui): a section's letter in it, and the list showing it
const sectionIndexLabel = (label: string) => createModifier('sectionIndexLabel', { label });
const listSectionIndexVisibility = (visibility: 'automatic' | 'visible' | 'hidden') =>
  createModifier('listSectionIndexVisibility', { visibility });

// the system's grey for a swipe action that isn't the row's main one
const addColor = '#8e8e93';
// Saira Semi Condensed, scaled with Dynamic Type from the text style it stands in for
const titleFont = font({ family: 'SairaSemiCondensed-Regular', size: 20, textStyle: 'body' });
const subtitleFont = font({ family: 'SairaSemiCondensed-Regular', size: 16, textStyle: 'subheadline' });
const sectionHeaderFont = font({ family: 'SairaSemiCondensed-SemiBold', size: 24, textStyle: 'title2' });
const playlistTitleFont = font({ family: 'SairaSemiCondensed-SemiBold', size: 28, textStyle: 'title' });
const previewTitleFont = font({ family: 'SairaSemiCondensed-SemiBold', size: 22, textStyle: 'title3' });
const rowVerticalInset = 12;
const iconSize = 14;

export default function NativeSongList({
  ref,
  sections,
  header,
  headerHeight,
  playlistTitle,
  footer,
  width,
  rowInsets,
  scrollOffset,
  onMove,
  favoriteIds,
  userPlaylists,
  toggleSong,
  shownUserPlaylistId,
  onNewPlaylistWithSong,
}: NativeSongListProps) {
  const background = useThemeColor('background');
  const text = useThemeColor('text');

  // the header's scroll effects, on the UI thread (iOS 18+)
  const scrollGeometry = useScrollGeometryChange((geometry) => {
    'worklet';
    scrollOffset.set(geometry.contentOffsetY);
  });

  const hasIndex = sections.some((section) => section.indexLabel);
  // a hosted React Native view's row: edge to edge, without a separator
  const hostedRowModifiers = [
    listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 }),
    listRowSeparator('hidden'),
  ];

  const renderRow = ({ item }: { item: Song }) => (
    <SongRow
      song={item}
      text={text}
      background={background}
      rowInsets={rowInsets}
      isFavorite={favoriteIds.has(item.id)}
      isReorderable={!!onMove}
      userPlaylists={userPlaylists}
      toggleSong={toggleSong}
      shownUserPlaylistId={shownUserPlaylistId}
      onNewPlaylistWithSong={onNewPlaylistWithSong}
    />
  );

  return (
    // The list runs under the bars, as the React Native one did: its offsets start at the screen's top, where the
    // forest is, and the footer keeps the last row clear of the bottom bar. The keyboard still shortens it.
    <Host style={{ flex: 1 }} ignoreSafeArea="container">
      <List
        ref={ref}
        modifiers={[
          listStyle('plain'),
          ...(hasIndex ? [listSectionIndexVisibility('visible')] : []),
          ...(scrollGeometry ? [scrollGeometry] : []),
        ]}
      >
        <Section>
          <Group modifiers={hostedRowModifiers}>
            <RNHostView matchContents>
              <View style={{ width, height: headerHeight }}>{header}</View>
            </RNHostView>
          </Group>
          {playlistTitle ? (
            <Text
              modifiers={[
                playlistTitleFont,
                foregroundStyle(text),
                listRowSeparator('hidden'),
                listRowBackground(background),
                listRowInsets({ top: padding, leading: rowInsets.leading, bottom: 4, trailing: rowInsets.trailing }),
              ]}
            >
              {playlistTitle}
            </Text>
          ) : null}
        </Section>
        {sections.map((section) => (
          <Section
            key={section.key}
            header={
              section.title ? (
                <Text modifiers={[sectionHeaderFont, foregroundStyle(text)]}>{section.title}</Text>
              ) : undefined
            }
            modifiers={section.indexLabel ? [sectionIndexLabel(section.indexLabel)] : undefined}
          >
            <List.ForEach
              data={section.songs}
              keyExtractor={(song) => song.id}
              estimatedItemSize={56}
              onMove={
                onMove
                  ? (sourceIndices, destination) => {
                      // one row at a time; SwiftUI counts the destination before the row leaves its place
                      const from = sourceIndices[0];
                      if (from === undefined) return;
                      onMove(from, destination > from ? destination - 1 : destination);
                    }
                  : undefined
              }
            >
              {renderRow}
            </List.ForEach>
          </Section>
        ))}
        <Section>
          <Group modifiers={[...hostedRowModifiers, listRowBackground(background)]}>
            <RNHostView matchContents>
              <View style={{ width }}>{footer}</View>
            </RNHostView>
          </Group>
        </Section>
      </List>
    </Host>
  );
}

type SongRowProps = {
  song: Song;
  text: string;
  background: string;
  rowInsets: { leading: number; trailing: number };
  isFavorite: boolean;
  isReorderable: boolean;
  userPlaylists: RowPlaylist[];
  toggleSong: (playlistId: string, songId: string) => boolean;
  shownUserPlaylistId?: string;
  onNewPlaylistWithSong: (songId: string) => void;
};

/**
 * A song's row: tapping opens it; swiping from the trailing edge offers Favorite (a full swipe toggles it) and Add to
 * playlist or, in a user playlist, Remove; holding it shows the lyrics with the same actions, or, in a reorderable
 * playlist, lifts it to be dragged. The swipe actions are SwiftUI's own, so their physics, haptics and VoiceOver
 * actions are the system's.
 */
function SongRow({
  song,
  text,
  background,
  rowInsets,
  isFavorite,
  isReorderable,
  userPlaylists,
  toggleSong,
  shownUserPlaylistId,
  onNewPlaylistWithSong,
}: SongRowProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const primary = useThemeColor('primary');
  // deep eglė in both modes, under the swipe action's white icon
  const chrome = useThemeColor('chrome');
  const { title, subtitle } = useTitle(song);

  const togglePlaylist = (playlistId: string) => haptic(toggleSong(playlistId, song.id) ? 'on' : 'off');
  const toggleFavorite = () => togglePlaylist(favoritesId);
  const favoriteLabel = isFavorite ? t('removeFromFavorites') : t('addToFavorites');
  const favoriteSymbol = isFavorite ? 'heart.slash.fill' : 'heart.fill';

  const icons = [
    isFavorite ? 'heart.fill' : null,
    Object.values(song.fields.Lyrics).some((l) => l['Show Chords']) ? 'guitars.fill' : null,
    Object.keys(song.fields.PDFs).length ? 'doc.fill' : null,
    Object.keys(song.fields.Audio).length ? 'play.fill' : null,
  ].filter((name): name is string => !!name);

  const playlistMenuItems = (
    <>
      {userPlaylists.map((playlist) => (
        <Toggle
          key={playlist.id}
          label={playlist.name}
          isOn={playlist.songIds.has(song.id)}
          onIsOnChange={() => togglePlaylist(playlist.id)}
        />
      ))}
      <Button
        label={t('createPlaylist')}
        systemImage={createPlaylistIcon.sfSymbol as never}
        onPress={() => onNewPlaylistWithSong(song.id)}
      />
    </>
  );

  const row = (
    <Button onPress={() => router.push(`/dainos/${song.id}`)}>
      <HStack spacing={10}>
        <VStack alignment="leading" spacing={0}>
          <Text modifiers={[titleFont, foregroundStyle(text)]}>{title}</Text>
          {subtitle ? <Text modifiers={[subtitleFont, foregroundStyle(withAlpha(text, 'BF'))]}>{subtitle}</Text> : null}
        </VStack>
        <Spacer minLength={0} />
        {icons.map((name) => (
          <Image key={name} systemName={name as never} size={iconSize} color={primary} />
        ))}
      </HStack>
    </Button>
  );

  return (
    <SwipeActions
      modifiers={[
        listRowInsets({
          top: rowVerticalInset,
          leading: rowInsets.leading,
          bottom: rowVerticalInset,
          trailing: rowInsets.trailing,
        }),
        listRowBackground(background),
      ]}
    >
      {isReorderable ? (
        // holding the row lifts it to be dragged, so no context menu
        row
      ) : (
        <ContextMenu>
          <ContextMenu.Items>
            <Button label={favoriteLabel} systemImage={favoriteSymbol} onPress={toggleFavorite} />
            {userPlaylists.length ? (
              <Menu label={t('addToPlaylist')} systemImage="text.badge.plus">
                {playlistMenuItems}
              </Menu>
            ) : null}
          </ContextMenu.Items>
          <ContextMenu.Trigger>{row}</ContextMenu.Trigger>
          <ContextMenu.Preview>
            <SongPreview song={song} title={title} subtitle={subtitle} text={text} background={background} />
          </ContextMenu.Preview>
        </ContextMenu>
      )}
      <SwipeActions.Actions edge="trailing">
        <Button
          label={favoriteLabel}
          systemImage={favoriteSymbol}
          onPress={toggleFavorite}
          modifiers={[tint(chrome)]}
        />
        {shownUserPlaylistId ? (
          <Button
            role="destructive"
            label={t('removeFromPlaylist')}
            systemImage="minus.circle.fill"
            onPress={() => togglePlaylist(shownUserPlaylistId)}
          />
        ) : (
          <Menu label={<Label title={t('addToPlaylist')} systemImage="text.badge.plus" />} modifiers={[tint(addColor)]}>
            {playlistMenuItems}
          </Menu>
        )}
      </SwipeActions.Actions>
    </SwipeActions>
  );
}

/** the context menu's preview: the title and the first variant's opening lines, without chords */
function SongPreview({
  song,
  title,
  subtitle,
  text,
  background,
}: {
  song: Song;
  title: string;
  subtitle?: string;
  text: string;
  background: string;
}) {
  const firstLyrics = Object.values(song.fields.Lyrics)[0];
  const lyrics = isLyrics(firstLyrics) ? plainLyrics(firstLyrics['Lyrics & Chords']) : '';
  return (
    <VStack
      alignment="leading"
      spacing={4}
      modifiers={[
        paddingModifier({ all: padding }),
        frame({ width: 340, alignment: 'leading' }),
        backgroundModifier(background),
      ]}
    >
      <Text modifiers={[previewTitleFont, foregroundStyle(text)]}>{title}</Text>
      {subtitle ? <Text modifiers={[subtitleFont, foregroundStyle(withAlpha(text, 'BF'))]}>{subtitle}</Text> : null}
      {lyrics ? (
        <Text modifiers={[paddingModifier({ top: 12 }), lineLimit(14), foregroundStyle(text)]}>{lyrics}</Text>
      ) : null}
    </VStack>
  );
}

/** the lyrics' markdown as plain text: chords (`[text](Chord)`) keep their text, markdown marks go */
function plainLyrics(markdown: string) {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_#>`\\]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
