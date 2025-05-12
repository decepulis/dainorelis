import { Platform, StyleSheet, View } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';

import { Link } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import { Song } from '@/lib/schemas/songs';

import ThemedText from '../ThemedText';
import { padding } from './constants';

type Props = {
  item: Song;
  isLast: boolean;
  title?: React.ReactNode;
  primary: string;
  separator: string;
  favorites: string[];
};
export function ListItem({ item, isLast, title, primary, separator, favorites }: Props) {
  // TODO slide to favorite
  return (
    <Link href={`/dainos/${item.id}`} asChild>
      <RectButton rippleColor={primary}>
        <View
          style={[
            styles.itemContainer,
            {
              borderBottomColor: separator,
              borderBottomWidth: isLast || Platform.OS !== 'ios' ? 0 : StyleSheet.hairlineWidth,
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
  );
}

export function ListHeader({ title, separator }: { title: string; separator: string }) {
  return (
    <ThemedText
      bold
      style={[
        styles.sectionHeader,
        {
          borderBottomWidth: Platform.OS !== 'ios' ? 0 : StyleSheet.hairlineWidth,
          borderBottomColor: separator,
        },
      ]}
    >
      {title}
    </ThemedText>
  );
}

const paddingVertical = (3 * padding) / 4;
const fontSize = 18;
const lineHeight = fontSize * 1.2;
export const listItemHeight = paddingVertical * 2 + lineHeight;

const styles = StyleSheet.create({
  sectionHeader: {
    marginLeft: padding,
    paddingRight: padding,
    paddingVertical,
    fontSize,
  },
  itemContainer: {
    marginLeft: padding,
    paddingRight: padding,
    paddingVertical,
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
