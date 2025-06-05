import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import { useSafeAreaFrame } from 'react-native-safe-area-context';

import { Link } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import { Song } from '@/lib/schemas/songs';
import useTitle from '@/lib/utils/useTitle';

import ThemedText from '../ThemedText';

type Props = {
  item: Song;
  primary: string;
  favorites: string[];
  background: string;
  separator: string;
  isLast?: boolean;
};
export function ListItem({ item, background, primary, favorites, separator, isLast }: Props) {
  // TODO slide to favorite
  const { isBoldTextEnabled, isHighContrastEnabled } = useAccessibilityInfo();
  const { title, subtitle } = useTitle(item);
  const { width } = useSafeAreaFrame();

  // from 375px to 450px, gently scale the icon size up
  const iconScale = Math.min(0.8, Math.max(0.65, width / 562.5));
  const iconSize = PixelRatio.roundToNearestPixel(fontSize * iconScale);
  const iconStyle = {
    width: iconSize,
    flexBasis: iconSize,
    flexShrink: 0,
    flexGrow: 0,
  };
  const icons = [
    favorites.includes(item.id) ? (
      <FontAwesome6 name="heart" key="heart" size={iconSize} solid color={primary} style={iconStyle} />
    ) : null,
    Object.values(item.fields.Lyrics).some((l) => l['Show Chords']) ? (
      <FontAwesome6 name="guitar" key="guitar" size={iconSize} solid color={primary} style={iconStyle} />
    ) : null,
    Object.keys(item.fields.PDFs).length ? (
      <FontAwesome6 name="file" key="file" size={iconSize} solid color={primary} style={iconStyle} />
    ) : null,
    Object.keys(item.fields.Audio).length ? (
      <FontAwesome6 name="play" key="play" size={iconSize} solid color={primary} style={iconStyle} />
    ) : null,
  ].filter(Boolean);

  return (
    <View style={styles.outerContainer}>
      <Link href={`/dainos/${item.id}`} asChild>
        <RectButton
          style={{
            backgroundColor: background,
          }}
        >
          <View
            style={[
              styles.container,
              styles.itemContainer,
              {
                borderBottomColor: separator,
                borderBottomWidth: Platform.OS === 'ios' && !isLast ? StyleSheet.hairlineWidth : 0,
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
      </Link>
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
});
