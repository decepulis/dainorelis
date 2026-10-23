import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

import Button from '@/lib/components/Button';
import { HeaderBackground, HeaderLeft, HeaderTitle, ModalToolbar } from '@/lib/components/Header';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import ThemedText from '@/lib/components/ThemedText';
import { pluralKey } from '@/lib/constants/i18n';
import padding from '@/lib/constants/padding';
import useContentColumnStyle from '@/lib/hooks/useContentColumnStyle';
import useHasHydrated from '@/lib/hooks/useHasHydrated';
import usePlaylists from '@/lib/hooks/usePlaylists';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { parsePlaylistParams } from '@/lib/utils/playlistLink';
import { splitTitle } from '@/lib/utils/useTitle';
import songs from '@/songs';

const songsById = new Map(songs.map((song) => [song.id, song]));

/**
 * A shared playlist's link (https://www.dainorelisapp.com/p?n=…&s=…, or dainorelis://p?…) lands here: the playlist's
 * name and songs, and a button to add it to the user's playlists. See lib/utils/playlistLink.ts.
 */
export default function Page() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const inset = useSafeAreaInsets();
  const contentColumn = useContentColumnStyle();
  const primary = useThemeColor('primary');
  const onPrimary = useThemeColor('onPrimary');
  const separator = useThemeColor('separator');
  const params = useLocalSearchParams<{ n?: string; s?: string }>();
  // web: the statically rendered page has no query, so the playlist only renders once hydrated
  const hasHydrated = useHasHydrated();
  const { createPlaylist } = usePlaylists();
  const { setValue: setSelectedPlaylistId } = useStorage('selectedPlaylistId');

  const { name: linkName, songIds, missingCount } = parsePlaylistParams(params);
  const name = linkName || t('newPlaylist');
  const isValid = songIds.length > 0;

  const addPlaylist = () => {
    const id = createPlaylist(name, songIds);
    if (id) setSelectedPlaylistId(id);
    router.dismissTo('/');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: (props) => <HeaderLeft {...props} modal />,
          headerBackground: () => <HeaderBackground />,
          headerTitle: () => <HeaderTitle showTitle title={t('playlist')} />,
        }}
      />
      <ModalToolbar />
      <ScrollViewWithHeader>
        <View
          style={[
            contentColumn,
            { paddingTop: padding * 2, paddingBottom: Math.max(inset.bottom + padding * 2, padding * 4) },
          ]}
        >
          {!hasHydrated ? null : (
            <>
              <ThemedText title bold style={styles.title}>
                {name}
              </ThemedText>
              {isValid ? (
                <>
                  <ThemedText style={styles.subtitle}>
                    {t(pluralKey('songCount', songIds.length, i18n.language), { n: songIds.length })}
                  </ThemedText>
                  {missingCount > 0 ? (
                    <ThemedText style={styles.note}>
                      {t(pluralKey('missingSongs', missingCount, i18n.language), { n: missingCount })}
                    </ThemedText>
                  ) : null}
                  <Button
                    noGlass
                    hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
                    style={styles.addButton}
                    innerStyle={[styles.addButtonInner, { backgroundColor: primary }]}
                    accessibilityLabel={t('addPlaylist')}
                    onPress={addPlaylist}
                  >
                    <ThemedText bold style={[styles.addButtonText, { color: onPrimary }]}>
                      {t('addPlaylist')}
                    </ThemedText>
                  </Button>
                  <View style={[styles.songs, { borderTopColor: separator }]}>
                    {songIds.map((id, index) => {
                      const [title, subtitle] = splitTitle(songsById.get(id)!.fields.Name);
                      return (
                        <View key={id} style={[styles.song, { borderBottomColor: separator }]}>
                          <ThemedText style={styles.songNumber}>{index + 1}</ThemedText>
                          <View style={styles.songTitles}>
                            <ThemedText title style={styles.songTitle}>
                              {title}
                            </ThemedText>
                            {subtitle ? <ThemedText style={styles.songSubtitle}>{subtitle}</ThemedText> : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </>
              ) : (
                <ThemedText style={styles.note}>
                  {missingCount > 0
                    ? t(pluralKey('missingSongs', missingCount, i18n.language), { n: missingCount })
                    : t('invalidPlaylistLink')}
                </ThemedText>
              )}
            </>
          )}
        </View>
      </ScrollViewWithHeader>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 28 * 1.25,
  },
  subtitle: {
    fontSize: 19,
    opacity: 0.75,
  },
  note: {
    marginTop: padding,
    fontSize: 17,
    lineHeight: 17 * 1.33,
    opacity: 0.8,
  },
  addButton: {
    marginTop: padding * 1.5,
    alignSelf: 'flex-start',
  },
  addButtonInner: {
    width: 'auto',
    height: 50,
    flexBasis: 'auto',
    borderRadius: 25,
    paddingHorizontal: padding * 1.5,
  },
  addButtonText: {
    fontSize: 17,
  },
  songs: {
    marginTop: padding * 1.5,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  song: {
    flexDirection: 'row',
    gap: padding / 2,
    paddingVertical: padding / 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  songNumber: {
    width: 28,
    fontSize: 18,
    lineHeight: 18 * 1.33,
    opacity: 0.5,
    fontVariant: ['tabular-nums'],
  },
  songTitles: {
    flex: 1,
  },
  songTitle: {
    fontSize: 18,
    lineHeight: 18 * 1.33,
  },
  songSubtitle: {
    opacity: 0.75,
  },
});
