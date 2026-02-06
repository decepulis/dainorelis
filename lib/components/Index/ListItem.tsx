import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import useStorage from '@/lib/hooks/useStorage';
import { Song } from '@/lib/schemas/songs';
import isLyrics from '@/lib/utils/isLyrics';
import useTitle from '@/lib/utils/useTitle';

import Markdown from '../Markdown';
import ThemedText from '../ThemedText';

type Props = {
  item: Song;
  primary: string;
  background: string;
  separator: string;
  isLast?: boolean;
};
export function ListItem({ item, background, primary, separator, isLast }: Props) {
  const { t } = useTranslation();
  const { isBoldTextEnabled, isHighContrastEnabled } = useAccessibilityInfo();
  const { title, subtitle } = useTitle(item);
  const { width } = useSafeAreaFrame();
  const { value: favorites, setValue: setFavorites } = useStorage('favorites');
  const isFavorite = favorites.includes(item.id);
  const firstLyrics = Object.values(item.fields.Lyrics)[0];

  const toggleFavorite = () => {
    if (isFavorite) {
      setFavorites(favorites.filter((id) => id !== item.id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } else {
      setFavorites([...favorites, item.id]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // from 375px to 450px, gently scale the icon size up
  const iconScale = Math.min(0.8, Math.max(0.65, width / 562.5));
  const iconSize = PixelRatio.roundToNearestPixel(fontSize * iconScale);
  const icons = [
    favorites.includes(item.id) ? (
      <FontAwesome6 name="heart" key="heart" size={iconSize} solid color={primary} style={iconStyle(iconSize)} />
    ) : null,
    Object.values(item.fields.Lyrics).some((l) => l['Show Chords']) ? (
      <FontAwesome6
        name="guitar"
        key="guitar"
        size={iconSize * 1.1}
        solid
        color={primary}
        style={iconStyle(iconSize * 1.1)}
      />
    ) : null,
    Object.keys(item.fields.PDFs).length ? (
      <FontAwesome6 name="file" key="file" size={iconSize} solid color={primary} style={iconStyle(iconSize)} />
    ) : null,
    Object.keys(item.fields.Audio).length ? (
      <FontAwesome6 name="play" key="play" size={iconSize} solid color={primary} style={iconStyle(iconSize)} />
    ) : null,
  ].filter(Boolean);

  const swipeableRef = useRef<ReanimatedSwipeable>(null);

  const renderRightActions = () => (
    <RectButton
      style={[styles.swipeAction, { backgroundColor: primary }]}
      onPress={() => {
        toggleFavorite();
        swipeableRef.current?.close();
      }}
    >
      <FontAwesome6 name="heart" size={20} solid={!isFavorite} color="#fff" />
    </RectButton>
  );

  return (
    <View style={[styles.outerContainer, { backgroundColor: background }]}>
      <ReanimatedSwipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        onSwipeableWillOpen={() => {
          toggleFavorite();
          swipeableRef.current?.close();
        }}
      >
        <Link href={`/dainos/${item.id}`} asChild>
          <Link.Trigger>
            <RectButton>
              <View
                style={[
                  styles.itemContainer,
                  {
                    backgroundColor: background,
                    paddingVertical: PixelRatio.roundToNearestPixel(paddingVertical),
                    paddingLeft: padding,
                    paddingRight: padding,
                  },
                ]}
              >
                <View style={styles.itemText}>
                  <ThemedText style={[styles.text, { letterSpacing: isBoldTextEnabled ? undefined : -0.05 }]}>
                    {title}
                  </ThemedText>
                  {subtitle ? (
                    <ThemedText style={{ opacity: isHighContrastEnabled ? 1 : 0.75 }}>{subtitle}</ThemedText>
                  ) : null}
                </View>
                {icons.length > 0 ? (
                  <View style={[styles.iconContainer, { gap: (fontSize * iconScale) / 1.75 }]}>{icons}</View>
                ) : null}
              </View>
            </RectButton>
          </Link.Trigger>
          <Link.Preview
            style={{
              backgroundColor: background,
              paddingHorizontal: padding,
              paddingVertical: padding * 1.5,
              width: 340,
              height: 440,
            }}
          >
            <View style={{ marginBottom: 20, gap: 4 }}>
              <ThemedText bold style={{ fontSize: 22 }}>
                {title}
              </ThemedText>
              {subtitle ? <ThemedText style={{ opacity: 0.75 }}>{subtitle}</ThemedText> : null}
              {isLyrics(firstLyrics) ? (
                <Markdown showLinksAsChords showChords={false}>
                  {firstLyrics['Lyrics & Chords']}
                </Markdown>
              ) : null}
            </View>
          </Link.Preview>
          <Link.Menu>
            <Link.MenuAction icon={isFavorite ? 'heart.fill' : 'heart'} onPress={toggleFavorite}>
              {isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            </Link.MenuAction>
          </Link.Menu>
        </Link>
      </ReanimatedSwipeable>
      {Platform.OS === 'ios' && !isLast ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: padding,
            right: 0,
            height: StyleSheet.hairlineWidth,
            backgroundColor: separator,
          }}
        />
      ) : null}
    </View>
  );
}

export function ListHeader({ title, background, separator }: { title: string; background: string; separator: string }) {
  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: background,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          {
            borderBottomColor: separator,
            borderBottomWidth: Platform.OS === 'ios' ? StyleSheet.hairlineWidth : 0,
          },
        ]}
      >
        <ThemedText bold style={[styles.sectionHeader, styles.text]}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
}

const iconStyle = (iconSize: number) => ({
  width: iconSize,
  flexBasis: iconSize,
  flexShrink: 0,
  flexGrow: 0,
});

const fontSize = 18;
const lineHeight = fontSize * 1.33;
export const listItemHeight = fontSize * 3;
const paddingVertical = (listItemHeight - lineHeight) / 2;

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  container: {
    paddingVertical: PixelRatio.roundToNearestPixel(paddingVertical),
    marginLeft: padding,
    paddingRight: padding,
  },
  text: {
    // keep this applied to <Text /> to avoid clipping diacriticals
    fontSize,
    lineHeight,
  },
  sectionHeader: {
    fontSize,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    flex: 1,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: padding,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
  },
});
