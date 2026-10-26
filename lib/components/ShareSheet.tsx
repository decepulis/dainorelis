import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import Button from '@/lib/components/Button';
import QRCode, { qrSvg } from '@/lib/components/QRCode';
import ThemedText from '@/lib/components/ThemedText';
import padding from '@/lib/constants/padding';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

const qrSize = 260;

/** the form sheet options of a route that renders ShareSheet */
export const shareSheetOptions = {
  presentation: 'formSheet',
  sheetAllowedDetents: 'fitToContents',
  sheetGrabberVisible: true,
  // Material's bottom sheet corners; iOS keeps the system's
  sheetCornerRadius: process.env.EXPO_OS === 'android' ? 28 : undefined,
  headerShown: false,
} as const;

type Props = {
  url: string;
  title: string;
  subtitle?: string;
  /** under the QR code: what scanning it opens */
  hint: string;
  /** instead of the QR code, when the link is too long for one */
  tooLongHint?: string;
};

/**
 * A link as a QR code, for the person next to you (no need to have each other's contact), and a button for the
 * system share sheet. Rendered by a form sheet route (shareSheetOptions)
 */
export default function ShareSheet({ url, title, subtitle, hint, tooLongHint }: Props) {
  const { t } = useTranslation();
  const inset = useSafeAreaInsets();
  const primary = useThemeColor('primary');
  const onPrimary = useThemeColor('onPrimary');
  const [didCopyLink, setDidCopyLink] = useState(false);

  // a QR code holds ~2,950 bytes; past that, the link alone
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
          ? { url, title }
          : { message: `${title}\n${url}`, title },
      { subject: title, dialogTitle: title }
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
          {title}
        </ThemedText>
        {subtitle ? <ThemedText style={styles.subtitle}>{subtitle}</ThemedText> : null}
      </View>
      {svg ? (
        <>
          <View style={[styles.qrCard, { borderColor: primary }]}>
            <QRCode svg={svg} size={qrSize} accessibilityLabel={t('qrCode', { name: title })} />
          </View>
          <ThemedText style={styles.hint}>{hint}</ThemedText>
        </>
      ) : (
        <ThemedText style={[styles.hint, styles.tooLongHint]}>{tooLongHint}</ThemedText>
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
  // QR codes need a light background, dark mode or not. Square, in the logo's frame
  qrCard: {
    backgroundColor: '#fff',
    borderWidth: padding / 2,
    padding: padding / 4,
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
