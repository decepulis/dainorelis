import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Image } from 'expo-image';
import { type Href, Link } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import padding from '@/lib/constants/padding';
import { appStoreUrl, playStoreUrl } from '@/lib/constants/storeUrls';
import useHasHydrated from '@/lib/hooks/useHasHydrated';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

import MenuView, { type MenuAction } from './MenuView';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

// the stores a browser's device can install from; read only once hydrated (the static HTML knows no browser)
function devicePlatform() {
  const ua = navigator.userAgent;
  if (/Android/.test(ua)) return 'android';
  // iPadOS asks for desktop sites, as a Mac with a touch screen
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
  return 'other';
}

const labelMinWidth = 600;

const stores = (platform: ReturnType<typeof devicePlatform>) => ({
  appStore: platform !== 'android',
  playStore: platform !== 'ios',
});

/**
 * A header button opening a menu of the stores, and a way to hide it. Not in iOS Safari, whose Smart App Banner
 * (app/+html.tsx) does the same
 */
export function GetTheAppButton() {
  const { t } = useTranslation();
  const hasHydrated = useHasHydrated();
  const { width } = useWindowDimensions();
  const { value: hidden, setValue: setHidden } = useStorage('hideGetTheApp');
  if (!hasHydrated || hidden) return null;
  const platform = devicePlatform();
  const isIosSafari = platform === 'ios' && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
  if (isIosSafari) return null;
  const show = stores(platform);

  const actions: MenuAction[] = [
    ...(show.appStore ? [{ id: 'appStore', title: 'App Store' }] : []),
    ...(show.playStore ? [{ id: 'playStore', title: 'Google Play' }] : []),
    { id: 'hideSection', title: '', displayInline: true, subactions: [{ id: 'hide', title: t('hideGetTheApp') }] },
  ];

  return (
    <View style={styles.headerButton}>
      <MenuView
        actions={actions}
        accessibilityLabel={t('getTheApp')}
        onPressAction={({ nativeEvent: { event } }) => {
          if (event === 'hide') setHidden(true);
          else location.assign(event === 'appStore' ? appStoreUrl : playStoreUrl);
        }}
      >
        {/* the label only where it clears the logo the header shows once scrolled */}
        <SystemView shadow={false} style={[styles.pill, width < labelMinWidth && styles.iconOnly]}>
          <FontAwesome6 name="mobile-screen-button" iconStyle="solid" size={15} color="#fff" />
          {width >= labelMinWidth ? (
            <ThemedText bold style={styles.pillText}>
              {t('getTheApp')}
            </ThemedText>
          ) : null}
        </SystemView>
      </MenuView>
    </View>
  );
}

/** The store badges (the device's store only, on a phone), with a word on the app and, on a phone, a link into it */
export function StoreBadges({ openPlaylistInApp }: { openPlaylistInApp?: boolean }) {
  const { t, i18n } = useTranslation();
  const hasHydrated = useHasHydrated();
  const primary = useThemeColor('primary');
  if (!hasHydrated) return null;
  const platform = devicePlatform();
  const show = stores(platform);
  const lt = i18n.language === 'lt';

  return (
    <View style={styles.badgeSection}>
      <ThemedText style={styles.pitch}>{t('appPitch')}</ThemedText>
      <View style={styles.badges}>
        {show.appStore ? (
          <Link href={appStoreUrl} asChild>
            <Pressable accessibilityLabel={t('appStoreBadge')}>
              <Image
                source={
                  lt
                    ? require('@/assets/images/stores/app_store_lt.svg')
                    : require('@/assets/images/stores/app_store_en.svg')
                }
                style={styles.appStoreBadge}
                accessible={false}
              />
            </Pressable>
          </Link>
        ) : null}
        {show.playStore ? (
          <Link href={playStoreUrl} asChild>
            <Pressable accessibilityLabel={t('playStoreBadge')}>
              <Image
                source={
                  lt
                    ? require('@/assets/images/stores/play_store_lt.svg')
                    : require('@/assets/images/stores/play_store_en.svg')
                }
                style={styles.playStoreBadge}
                accessible={false}
              />
            </Pressable>
          </Link>
        ) : null}
      </View>
      {/* this page in the app, by its own scheme: for when the link didn't open the app (typed or pasted into the
          browser) */}
      {openPlaylistInApp && platform !== 'other' ? (
        <Link href={`dainorelis:/${location.pathname}${location.search}` as Href} asChild>
          <Pressable>
            <ThemedText style={[styles.openInApp, { color: primary }]}>{t('openPlaylistInApp')}</ThemedText>
          </Pressable>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    marginLeft: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding / 3,
    height: 32,
    paddingHorizontal: padding * 0.6,
    borderRadius: 16,
  },
  iconOnly: {
    width: 32,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  pillText: {
    color: '#fff',
    fontSize: 15,
  },
  badgeSection: {
    marginTop: padding * 2,
    gap: padding,
  },
  pitch: {
    fontSize: 17,
    lineHeight: 17 * 1.33,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: padding,
  },
  // the badges' own aspect ratios
  appStoreBadge: {
    height: 40,
    width: 40 * (119.664 / 40),
  },
  playStoreBadge: {
    height: 40,
    width: 135,
  },
  openInApp: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});
