import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLocalSearchParams } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import Button from '@/lib/components/Button';
import NotFound from '@/lib/components/NotFound';
import QRCode, { qrSvg } from '@/lib/components/QRCode';
import ThemedText from '@/lib/components/ThemedText';
import { pluralKey } from '@/lib/constants/i18n';
import padding from '@/lib/constants/padding';
import usePlaylists from '@/lib/hooks/usePlaylists';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { playlistUrl } from '@/lib/utils/playlistLink';

const qrSize = 260;

/** A sheet with the playlist's link as a QR code, for the person next to you, and the system share sheet */
export default function Page() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const inset = useSafeAreaInsets();
  const primary = useThemeColor('primary');
  const onPrimary = useThemeColor('onPrimary');
  const { getPlaylist } = usePlaylists();
  const [didCopyLink, setDidCopyLink] = useState(false);
  const playlist = getPlaylist(id);
  if (!playlist) {
    return <NotFound modal message={t('pageNotFound')} />;
  }

  const url = playlistUrl(playlist.name, playlist.songIds);
  // a QR code holds a link to ~190 songs; past that, the link alone
  const svg = qrSvg(url);
  const shareLink = () => {
    // browsers without the Web Share API (most desktop ones) copy the link instead
    if (process.env.EXPO_OS === 'web' && !navigator.share) {
      navigator.clipboard.writeText(url).then(() => setDidCopyLink(true), console.warn);
      return;
    }
    Share.share(
      // iOS and web share the URL as a link; Android only takes text
      process.env.EXPO_OS === 'ios'
        ? { url }
        : process.env.EXPO_OS === 'web'
          ? { url, title: playlist.name }
          : { message: `${playlist.name}\n${url}`, title: playlist.name },
      { subject: playlist.name, dialogTitle: playlist.name }
    ).catch((e) => {
      // web: the share sheet was dismissed
      if (e?.name !== 'AbortError') console.warn(e);
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom:
            // the iOS sheet already stays clear of the home indicator; Android's runs under the gesture bar
            process.env.EXPO_OS === 'ios' ? padding * 1.5 : inset.bottom + padding * 1.5,
        },
      ]}
    >
      <View style={styles.titles}>
        <ThemedText title bold style={styles.title} numberOfLines={2}>
          {playlist.name}
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {t(pluralKey('songCount', playlist.songIds.length, i18n.language), { n: playlist.songIds.length })}
        </ThemedText>
      </View>
      {svg ? (
        <>
          <View style={styles.qrCard}>
            <QRCode svg={svg} size={qrSize} accessibilityLabel={t('qrCode', { name: playlist.name })} />
          </View>
          <ThemedText style={styles.hint}>{t('sharePlaylistHint')}</ThemedText>
        </>
      ) : (
        <ThemedText style={[styles.hint, styles.tooLongHint]}>{t('playlistTooLongForQRCode')}</ThemedText>
      )}
      <Button
        noGlass
        hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
        innerStyle={[styles.shareButton, { backgroundColor: primary }]}
        accessibilityLabel={didCopyLink ? t('linkCopied') : t('shareLink')}
        onPress={shareLink}
      >
        <FontAwesome6
          name={process.env.EXPO_OS === 'ios' ? 'arrow-up-from-bracket' : 'share-nodes'}
          iconStyle="solid"
          size={16}
          color={onPrimary}
        />
        <ThemedText bold style={[styles.shareButtonText, { color: onPrimary }]}>
          {didCopyLink ? t('linkCopied') : t('shareLink')}
        </ThemedText>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: padding * 2,
    paddingHorizontal: padding * 1.5,
    gap: padding,
  },
  titles: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontSize: 22,
    lineHeight: 22 * 1.25,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.75,
  },
  // QR codes need a light background, dark mode or not
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: padding,
    padding: padding / 2,
  },
  hint: {
    textAlign: 'center',
    opacity: 0.8,
    maxWidth: 340,
  },
  tooLongHint: {
    marginVertical: padding,
  },
  shareButton: {
    width: 'auto',
    height: 50,
    flexBasis: 'auto',
    borderRadius: 25,
    paddingHorizontal: padding * 1.5,
    flexDirection: 'row',
    gap: padding / 2,
  },
  shareButtonText: {
    fontSize: 17,
  },
});
