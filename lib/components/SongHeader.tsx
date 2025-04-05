import React, { memo, useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts } from '../constants/themes';
import useDefaultHeaderHeight from '../hooks/useDefaultHeaderHeight';
import { useThemeColor } from '../hooks/useThemeColor';
import { Audio } from '../schemas/audio';
import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import { Song } from '../schemas/songs';
import { Videos } from '../schemas/videos';
import HomeButton from './HomeButton';
import SongMenu from './SongMenu';
import ThemedText from './ThemedText';

const timing = {
  duration: 200,
};

type SongHeaderProps = {
  title: string[];
  isTitleBehind: boolean;
  song: Song;
  variants: (Lyrics | PDFs)[];
  activeVariant: Lyrics | PDFs;
  setActiveVariantIndex: (v: number) => void;
  media: (Audio | Videos)[];
  activeMedia: Audio | Videos | null;
  setActiveMediaIndex: (v: number | null) => void;
};
const _SongHeader = ({
  title,
  isTitleBehind,
  song,
  variants,
  activeVariant,
  setActiveVariantIndex,
  media,
  activeMedia,
  setActiveMediaIndex,
}: SongHeaderProps) => {
  const height = useDefaultHeaderHeight();
  const inset = useSafeAreaInsets();

  const background = useThemeColor('background');
  const primary = useThemeColor('primary');
  const titleSv = useSharedValue(isTitleBehind);

  useEffect(() => {
    titleSv.value = isTitleBehind;
  }, [isTitleBehind, titleSv]);

  // TODO reduce motion
  // const animatedHeaderStyle = useAnimatedStyle(() => ({
  //   backgroundColor: withTiming(titleSv.value ? primary : background, timing),
  // }));

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: withTiming(titleSv.value ? 1 : 0, timing),
    transform: [{ translateY: withTiming(titleSv.value ? 0 : 5, timing) }],
  }));

  return (
    <>
      <Animated.View
        style={[
          {
            height,
            paddingTop: inset.top,
            backgroundColor: primary,
          },
          styles.header,
          // animatedHeaderStyle,
        ]}
      >
        <HomeButton />
        <Animated.View
          style={[
            {
              top: inset.top,
            },
            styles.title,
            animatedTitleStyle,
          ]}
        >
          {title
            ? title.map((part, index) => (
                <ThemedText
                  key={index}
                  numberOfLines={title.length === 1 && index === 0 ? 2 : 1}
                  style={[
                    {
                      ...(index === 0 ? fonts.bold : fonts.regular),
                      fontSize: title.length === 1 ? 17 : index === 0 ? 16 : 14,
                      lineHeight: title.length === 1 ? 17 * 1.25 : index === 0 ? 16 * 1.25 : 14 * 1.25,
                      textAlign: Platform.select({ default: 'center', android: 'left' }),
                      position: 'relative',
                      top: title.length === 1 ? 1 : 0,
                      color: '#fff',
                    },
                  ]}
                >
                  {part}
                </ThemedText>
              ))
            : null}
        </Animated.View>
        <SongMenu
          song={song}
          variants={variants}
          activeVariant={activeVariant}
          setActiveVariantIndex={setActiveVariantIndex}
          media={media}
          activeMedia={activeMedia}
          setActiveMediaIndex={setActiveMediaIndex}
        />
      </Animated.View>
    </>
  );
};
const SongHeader = memo(_SongHeader);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  title: {
    position: 'absolute',
    left: 60,
    right: 60,
    bottom: 0,
    justifyContent: 'center',
    alignItems: Platform.select({ default: 'center', android: 'flex-start' }),
  },
});

export default SongHeader;
