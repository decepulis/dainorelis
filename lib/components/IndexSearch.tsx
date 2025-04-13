import { useTranslation } from 'react-i18next';
import { StyleSheet, TextInput, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { BlurView } from 'expo-blur';

import { fonts } from '../constants/themes';
import useDefaultHeaderHeight from '../hooks/useDefaultHeaderHeight';
import { useThemeColor } from '../hooks/useThemeColor';
import SegmentedControl from './SegmentedControl';
import SystemView from './SystemView';

type Props = {
  filter: 'allSongs' | 'favoriteSongs';
  setFilter: (value: 'allSongs' | 'favoriteSongs') => void;
  setSearchText: (text: string) => void;
  setSearchHeight: (height: number) => void;
  margin: number;
  padding: number;
  scrollY: Animated.SharedValue<number>;
};
export default function IndexSearch({
  filter,
  setFilter,
  setSearchText,
  setSearchHeight,
  margin,
  padding,
  scrollY,
}: Props) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const isDark = useColorScheme() === 'dark';

  // hard coding this for now
  const howFarThisIsFromTheTop = useSharedValue(250);

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity:
      scrollY.value > howFarThisIsFromTheTop.value
        ? withTiming(1, { duration: 150 })
        : withTiming(0, { duration: 150 }),
  }));

  return (
    <View style={{ position: 'relative' }}>
      <Animated.View style={[StyleSheet.absoluteFill, fadeInStyle]}>
        <SystemView
          variant="primary"
          style={[StyleSheet.absoluteFill, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: primary }]}
        />
      </Animated.View>
      <View
        onLayout={(event) => {
          setSearchHeight(event.nativeEvent.layout.height);
        }}
        style={{
          paddingHorizontal: margin + padding - 5,
          paddingVertical: padding / 4,
        }}
      >
        <SegmentedControl
          options={[
            { label: t('allSongs'), value: 'allSongs' },
            { label: t('favoriteSongs'), value: 'favoriteSongs' },
          ]}
          value={filter}
          onValueChange={(value) => {
            setFilter(value as 'allSongs' | 'favoriteSongs');
          }}
        />
        <TextInput
          style={[
            fonts.regular, // a11y bold
            {
              // TODO theme
              backgroundColor: isDark ? `rgba(255,255,255,0.125)` : `rgba(0,0,0,0.075)`,
              color: text,
              marginTop: padding / 4,
              paddingHorizontal: padding,
              height: 40,
              borderRadius: 15,
            },
          ]}
          clearButtonMode="while-editing"
          autoCorrect={false}
          onChangeText={setSearchText}
          returnKeyType="done"
          selectionColor={primary}
        />
      </View>
    </View>
  );
}
