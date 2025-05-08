import { Pressable, StyleSheet } from 'react-native';

import { Link } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Song } from '@/lib/schemas/songs';

import ThemedText from '../ThemedText';
import { padding } from './constants';

type Props = {
  item: Song;
  isLast: boolean;
  title?: React.ReactNode;
};
export default function ListItem({ item, isLast, title }: Props) {
  const primary = useThemeColor('primary');
  const separator = useThemeColor('separator');
  const { value: favorites } = useStorage('favorites');

  return (
    <Link
      style={[
        styles.itemContainer,
        {
          borderBottomColor: separator,
          borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
        },
      ]}
      href={`/dainos/${item.id}`}
      asChild
    >
      <Pressable>
        <ThemedText style={styles.itemText}>{title || item.fields.Name}</ThemedText>
        {favorites.includes(item.id) ? (
          <FontAwesome6 name="heart" size={20} color={primary} solid style={styles.itemHeart} />
        ) : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    marginLeft: padding,
    paddingRight: padding,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 18,
    letterSpacing: -0.1,
    flex: 1,
  },
  itemHeart: {
    width: 20,
    height: 20,
    flexShrink: 0,
    flexBasis: 20,
    marginLeft: 20,
  },
});
