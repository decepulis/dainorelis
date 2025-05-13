import { PixelRatio, Platform, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { Link } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import maxWidth from '@/lib/constants/maxWidth';
import { Song } from '@/lib/schemas/songs';

import ThemedText from '../ThemedText';
import { padding } from './constants';

type Props = {
  item: Song;
  title?: React.ReactNode;
  primary: string;
  favorites: string[];
  background: string;
  separator: string;
  isLast?: boolean;
};
export function ListItem({ item, title, background, primary, favorites, separator, isLast }: Props) {
  // TODO slide to favorite
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
            <ThemedText style={styles.itemText}>{title || item.fields.Name}</ThemedText>
            {favorites.includes(item.id) ? (
              <FontAwesome6 name="heart" size={fontSize} color={primary} solid style={styles.itemHeart} />
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
        <ThemedText bold style={[styles.sectionHeader]}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
}

const paddingVertical = (3 * padding) / 4;
const fontSize = 17;
const lineHeight = fontSize * 1.2;
export const listItemHeight = paddingVertical * 2 + lineHeight;

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
  sectionHeader: {
    fontSize,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize,
    lineHeight,
    letterSpacing: -0.1,
    flex: 1,
  },
  itemHeart: {
    width: fontSize,
    height: fontSize,
    flexShrink: 0,
    flexBasis: fontSize,
    marginLeft: fontSize,
  },
});
