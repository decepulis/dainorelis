import React, { memo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import maxWidth from '@/lib/constants/maxWidth';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

export const indexSearchHeight = 130;

type IndexSearchProps = {
  filter: string;
  setFilter: (value: 'Visos' | 'Mano') => void;
  searchText: string;
  setSearchText: (value: string) => void;
};
const _IndexSearch = ({ filter, setFilter, searchText, setSearchText }: IndexSearchProps) => {
  const color = useThemeColor('text');
  const background = useThemeColor('background');
  const cardDark = useThemeColor('cardDark');
  const primary = useThemeColor('primary');

  return (
    <View style={[{ borderColor: color, backgroundColor: background }, styles.searchContainer]}>
      <View style={styles.innerSearchContainer}>
        <SegmentedControl
          backgroundColor={cardDark}
          style={styles.searchFilter}
          sliderStyle={styles.searchFilterSlider}
          tintColor={primary}
          fontStyle={{ color, fontSize: 16, fontFamily: 'KlavikaRegular' }}
          activeFontStyle={{ fontSize: 16, fontFamily: 'KlavikaRegular', fontWeight: 'normal', color: '#fff' }}
          selectedIndex={filter === 'Visos' ? 0 : 1}
          onValueChange={setFilter as (value: string) => void}
          values={['Visos', 'Mano']}
        />
        <View style={styles.searchInputContainer}>
          <TextInput
            style={[{ backgroundColor: cardDark, color }, styles.searchInput]}
            clearButtonMode="while-editing"
            autoCorrect={false}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="done"
            selectionColor={primary}
          />
          <View style={styles.searchInputIconContainer}>
            <Ionicons name="search" size={18} color={color} />
          </View>
        </View>
      </View>
    </View>
  );
};
const IndexSearch = memo(_IndexSearch);

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 20,
    height: indexSearchHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
  },
  innerSearchContainer: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  searchFilter: { height: 40, borderRadius: 6 },
  searchFilterSlider: { borderRadius: 4 },
  searchInputContainer: {
    marginTop: 10,
    position: 'relative',
  },
  searchInput: {
    fontSize: 16,
    fontFamily: 'KlavikaRegular',
    height: 40,
    borderRadius: 6,
    paddingLeft: 40,
  },
  searchInputIconContainer: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    width: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IndexSearch;
