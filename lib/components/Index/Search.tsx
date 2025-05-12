import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutChangeEvent, NativeMethods, Platform, StyleSheet, TextInput, View } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
} from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';

import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';

import { useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';

import maxWidth from '../../constants/maxWidth';
import { fonts } from '../../constants/themes';
import useA11yBoldText from '../../hooks/useA11yBoldText';
import { useThemeColor } from '../../hooks/useThemeColor';
import { buttonSlop, styles as buttonStyles } from '../Button';
import SegmentedControl from '../SegmentedControl';
import SystemView from '../SystemView';

type Props = {
  scrollRef: AnimatedRef<AnimatedScrollView>;
  filter: 'allSongs' | 'favoriteSongs';
  setFilter: (value: 'allSongs' | 'favoriteSongs') => void;
  isSongFestivalMode: boolean;
  setIsSongFestivalMode: (value: boolean) => void;
  setSearchText: (text: string) => void;
  setSearchHeight: (height: number) => void;
  padding: number;
};
export default function IndexSearch({
  scrollRef,
  filter,
  setFilter,
  isSongFestivalMode,
  setIsSongFestivalMode,
  setSearchText,
  setSearchHeight,
  padding,
}: Props) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const separator = useThemeColor('separator');
  const card = useThemeColor('card');
  const scrollOffset = useScrollViewOffset(scrollRef);
  const headerHeight = useHeaderHeight();
  const { setDidSongFestivalLoad } = useDidImagesLoad();

  const isBoldTextEnabled = useA11yBoldText();

  const howFarThisIsFromTheTop = useSharedValue(250);
  const figureOutHowFarThisIsFromTheTop = useCallback(
    (event: LayoutChangeEvent) => {
      const scrollEl = scrollRef.current as NativeMethods | null;
      if (!scrollEl) return;
      event.target.measureLayout(scrollEl, (_x, y) => {
        howFarThisIsFromTheTop.value = y - headerHeight;
      });
    },
    [headerHeight, howFarThisIsFromTheTop, scrollRef]
  );

  const fadeInStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollOffset.value,
      [howFarThisIsFromTheTop.value, howFarThisIsFromTheTop.value + padding],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  return (
    // TODO if this is wide enough, make it horizontal
    <View style={{ position: 'relative' }} onLayout={figureOutHowFarThisIsFromTheTop}>
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
          maxWidth: maxWidth,
          width: '100%',
          marginHorizontal: 'auto',
          paddingHorizontal: padding - 5,
          paddingVertical: padding / 4,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: buttonSlop.left }}>
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
          <BorderlessButton
            // TODO why is this not rippling?
            rippleColor={primary}
            onPress={() => {
              Haptics.impactAsync(
                isSongFestivalMode ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium
              );
              setIsSongFestivalMode(!isSongFestivalMode);
            }}
          >
            <View
              style={[
                buttonStyles.container,
                {
                  backgroundColor: isSongFestivalMode ? 'black' : `${card}bb`,
                  ...Platform.select({
                    ios: {
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: separator,
                    },
                    default: {
                      boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)',
                    },
                  }),
                },
              ]}
            >
              <Image
                source={require('@/assets/images/ds2025_logo_image.png')}
                style={{
                  width: '75%',
                  height: '75%',
                }}
                onLoad={() => setDidSongFestivalLoad(true)}
                contentFit="contain"
                contentPosition="center"
              />
            </View>
          </BorderlessButton>
        </View>
        <View
          style={{
            marginTop: padding / 4,
            position: 'relative',
            height: 40,
            borderRadius: 15,
            backgroundColor: `${card}bb`,
            ...Platform.select({
              ios: {
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: separator,
              },
              default: {
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.05)',
              },
            }),
          }}
        >
          <TextInput
            style={[
              isBoldTextEnabled ? fonts.bold : fonts.regular,
              {
                height: '100%',
                color: text,
                marginRight: 10,
                marginLeft: 40,
              },
            ]}
            clearButtonMode="while-editing"
            autoCorrect={false}
            onChangeText={setSearchText}
            returnKeyType="done"
            selectionColor={primary}
          />
          <View
            style={{
              position: 'absolute',
              left: 10,
              top: 0,
              bottom: 0,
              width: 20,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="search" size={18} color={text} />
          </View>
        </View>
      </View>
    </View>
  );
}
