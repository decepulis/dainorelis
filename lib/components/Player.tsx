import { ComponentPropsWithoutRef, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/springUtils';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';

import { FontAwesome6 } from '@expo/vector-icons';

import appPadding from '@/lib/constants/padding';

import maxWidth from '../constants/maxWidth';
import useAccessibilityInfo from '../hooks/useAccessibilityInfo';
import useIsAppVisible from '../hooks/useAppState';
import { Audio } from '../schemas/audio';
import Button, { buttonSlop, styles as buttonStyles } from './Button';
import MediaMenu from './MediaMenu';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const padding = buttonSlop.left + buttonSlop.right;
const extraDurationPadding = padding / 2;
const buttonWidth = buttonStyles.button.width;
export const playerHeight = buttonStyles.button.height + 2 * padding;

const springConfig: SpringConfig = {
  mass: 1,
  damping: 30,
  stiffness: 300,
};

// TODO figure out a way to fling this around to get it out of the way of PDFs
type Props = {
  media: { [id: string]: Audio };
  activeMediaId: string;
  setActiveMediaId: (id: string) => void;
  style?: ComponentPropsWithoutRef<typeof Animated.View>['style'];
};
export default function Player({ media, activeMediaId, setActiveMediaId, style }: Props) {
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();
  const { isHighContrastEnabled } = useAccessibilityInfo();
  const { i18n } = useTranslation();
  const isAppVisible = useIsAppVisible();
  const isAppWide = useMemo(() => width > maxWidth, [width]);

  // layout
  const playerWidth = useMemo(
    () => (isAppWide ? 360 : width - Math.max(inset.left, appPadding / 2) - Math.max(inset.right, appPadding / 2)),
    [isAppWide, width, inset.left, inset.right]
  );
  // this is ludicrous, I know. but dang is that animation smooth.
  const durationWidth = useMemo(
    () =>
      Object.keys(media).length > 1
        ? playerWidth -
          padding -
          buttonWidth -
          padding -
          buttonWidth -
          padding -
          extraDurationPadding -
          // duration goes here
          extraDurationPadding -
          padding -
          buttonWidth -
          padding
        : playerWidth -
          padding -
          buttonWidth -
          padding -
          extraDurationPadding -
          // duration goes here
          extraDurationPadding -
          padding -
          buttonWidth -
          padding,
    [media.length, playerWidth]
  );

  // Manage media
  const [shouldLoad, setShouldLoad] = useState(false);
  const activeMedia = media[activeMediaId];
  // TODO maybe a better offline experience?
  const player = useAudioPlayer(shouldLoad && activeMedia ? activeMedia.URL : null);
  const { currentTime, duration, playing, isBuffering, isLoaded } = useAudioPlayerStatus(player);

  const [shouldPlayOnLoad, setShouldPlayOnLoad] = useState(false);
  useEffect(() => {
    if (isLoaded && shouldPlayOnLoad) {
      player.play();
      setShouldPlayOnLoad(false);
    }
  }, [isLoaded, shouldPlayOnLoad, player]);

  // handle background audio
  useEffect(() => {
    if (!isAppVisible) {
      player.pause();
    }
  }, [isAppVisible, player]);

  // can't do this without setting playsInSilentMode == false
  // (why can players like apple music do this?)
  // TODO figure it out
  // useEffect(() => {
  //   setAudioModeAsync({ shouldPlayInBackground: true });
  // }, []);

  // Manage animations
  const isOpenSv = useSharedValue(false);
  const containerStyles = useAnimatedStyle(() => ({
    width: withSpring(
      isOpenSv.value ? playerWidth : padding + buttonWidth + padding + buttonWidth + padding,
      springConfig
    ),
  }));
  const opacityStyles = useAnimatedStyle(() => ({
    opacity: withSpring(isOpenSv.value ? 1 : 0, springConfig),
    pointerEvents: isOpenSv.value ? 'auto' : 'none',
  }));
  const plusStyles = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: withSpring(isOpenSv.value ? '0deg' : '-90deg', springConfig),
      },
    ],
  }));

  // manage duration / gestures
  const progressSv = useSharedValue(0);
  const gestureStartProgressSv = useSharedValue(0);
  const isGesturingSv = useSharedValue(false);
  const didBumpSv = useSharedValue(false);

  // sync state with time elapsed
  useEffect(() => {
    if (!isGesturingSv.value) {
      progressSv.value = currentTime / duration;
    }
  }, [currentTime, duration, isGesturingSv, progressSv]);
  const seekOnGestureFinalize = useCallback(
    (time: number) => {
      player.seekTo(time).finally(() => (isGesturingSv.value = false));
    },
    [isGesturingSv, player]
  );

  // override state with gesture
  const gesture = Gesture.Pan()
    .hitSlop({ ...buttonSlop, top: padding, bottom: padding })
    .minDistance(1)
    .onStart(() => {
      isGesturingSv.value = true;
      gestureStartProgressSv.value = progressSv.value;
    })
    .onUpdate((e) => {
      const gestureProgress = e.translationX / durationWidth;
      const newValue = Math.max(0, Math.min(1, gestureStartProgressSv.value + gestureProgress));
      progressSv.value = newValue;

      // side-effect: bump!
      if (!didBumpSv.value && (newValue === 0 || newValue === 1)) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
        didBumpSv.value = true;
      } else if (didBumpSv.value && newValue !== 0 && newValue !== 1) {
        // reset state
        didBumpSv.value = false;
      }
    })
    .onFinalize(() => {
      const seekTime = progressSv.value * duration;
      runOnJS(seekOnGestureFinalize)(seekTime);
    });

  // commit gesture stuff to styles
  const durationContainerStyles = useAnimatedStyle(() => ({
    height: withSpring(isGesturingSv.value ? padding : padding / 2, { mass: 1, damping: 30, stiffness: 500 }),
  }));
  const durationStyles = useAnimatedStyle(() => ({
    width: `${progressSv.value * 100}%`,
  }));

  return activeMedia ? (
    <Animated.View
      style={[
        containerStyles,
        {
          position: 'absolute',
          bottom: Math.max(inset.bottom, appPadding),
          right: Math.max(inset.right, isAppWide ? appPadding : appPadding / 2),
          height: playerHeight,
          borderRadius: playerHeight / 2,
          overflow: 'hidden',
          boxShadow: '0 0 20px rgba(64, 64, 64, 0.1)',
        },
        style,
      ]}
    >
      <SystemView
        variant="primary"
        style={{
          flex: 1,
          position: 'relative',
        }}
      >
        {/* TODO blocker? why are these not rippling? */}
        <Button
          hitSlop={{ top: padding, bottom: padding, left: padding }}
          style={{ position: 'absolute', left: padding, top: padding, bottom: padding }}
          onPress={() => {
            setShouldLoad(true);
            isOpenSv.value = !isOpenSv.value;
          }}
        >
          <FontAwesome6 name="minus" size={17} color="white" />
          <Animated.View style={[plusStyles, { position: 'absolute' }]}>
            <FontAwesome6 name="minus" size={17} color="white" />
          </Animated.View>
        </Button>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              opacityStyles,
              {
                position: 'absolute',
                right:
                  Object.keys(media).length > 1
                    ? padding + buttonWidth + padding + buttonWidth + padding + extraDurationPadding
                    : padding + buttonWidth + padding + extraDurationPadding,
                width: durationWidth,
                top: padding,
                bottom: padding,
                justifyContent: Object.keys(media).length > 1 ? 'space-between' : 'center',
              },
            ]}
          >
            {Object.keys(media).length > 1 ? (
              <ThemedText style={{ color: 'white' }} numberOfLines={1}>
                {i18n.language === 'en' ? activeMedia['EN Variant Name'] : activeMedia['Variant Name']}
              </ThemedText>
            ) : null}
            <Animated.View
              style={[
                durationContainerStyles,
                {
                  borderRadius: 9999,
                  overflow: 'hidden',
                },
                isHighContrastEnabled
                  ? {
                      borderColor: `rgba(255,255,255,0.4)`,
                      borderWidth: 1,
                    }
                  : {
                      backgroundColor: `rgba(255,255,255,0.4)`,
                    },
              ]}
            >
              <Animated.View
                style={[
                  durationStyles,
                  {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    borderRadius: 9999,
                    backgroundColor: 'white',
                  },
                ]}
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {Object.keys(media).length > 1 ? (
          <Animated.View
            style={[
              opacityStyles,
              {
                position: 'absolute',
                right: padding + buttonWidth + padding,
                top: padding,
                bottom: padding,
              },
            ]}
          >
            <MediaMenu
              hitSlop={{ top: padding, bottom: padding }}
              media={media}
              activeMediaId={activeMediaId}
              setActiveMediaId={setActiveMediaId}
            />
          </Animated.View>
        ) : null}

        <Button
          hitSlop={{ top: padding, bottom: padding, right: padding }}
          style={{ position: 'absolute', right: padding, top: padding, bottom: padding }}
          onPress={() => {
            if (!isLoaded) {
              setShouldLoad(true);
              setShouldPlayOnLoad(true);
            } else if (playing) {
              player.pause();
            } else {
              player.play();
            }
          }}
        >
          {/* TODO animate state change */}
          {(isBuffering || !isLoaded) && shouldLoad ? (
            <ActivityIndicator color="white" />
          ) : playing ? (
            <FontAwesome6 name="pause" size={14} color="white" />
          ) : (
            <FontAwesome6 name="play" size={14} color="white" />
          )}
        </Button>
      </SystemView>
    </Animated.View>
  ) : null;
}
