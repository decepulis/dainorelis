import { ComponentPropsWithoutRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';
import { AudioPro, useAudioPro } from 'react-native-audio-pro';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/springUtils';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';

import { FontAwesome6 } from '@expo/vector-icons';
import * as Sentry from '@sentry/react-native';

import appPadding from '@/lib/constants/padding';

import maxWidth from '../constants/maxWidth';
import useAccessibilityInfo from '../hooks/useAccessibilityInfo';
import { Audio } from '../schemas/audio';
import Button, { buttonSlop, styles as buttonStyles } from './Button';
import MediaMenu from './MediaMenu';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const artwork = require('@/assets/images/icon.png');

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
  title: string;
  media: Audio[];
  activeMediaIndex: number;
  setActiveMediaIndex: (index: number) => void;
  style?: ComponentPropsWithoutRef<typeof Animated.View>['style'];
};
export default function Player({ title, media, activeMediaIndex, setActiveMediaIndex, style }: Props) {
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();
  const { isHighContrastEnabled } = useAccessibilityInfo();
  const { t } = useTranslation();
  const isAppWide = useMemo(() => width > maxWidth, [width]);

  // layout
  const playerWidth = useMemo(
    () => (isAppWide ? 360 : width - Math.max(inset.left, appPadding / 2) - Math.max(inset.right, appPadding / 2)),
    [isAppWide, width, inset.left, inset.right]
  );
  // this is ludicrous, I know. but dang is that animation smooth.
  const durationWidth = useMemo(
    () =>
      media.length > 1
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
  const activeMedia = media[activeMediaIndex];

  // AudioPro state
  const { state, position, duration, playingTrack, error } = useAudioPro();
  const isLoaded = state !== 'IDLE' && state !== 'ERROR';
  const playing = state === 'PLAYING';
  const loading = state === 'LOADING';

  const loadTrack = useCallback(() => {
    try {
      AudioPro.stop();
      AudioPro.play({
        id: activeMedia.URL,
        url: activeMedia.URL,
        title,
        artist: activeMedia['Variant Name'].replace('Įrašas', t('media')),
        artwork: artwork,
      });
    } catch (error) {
      console.error('Error setting up track:', error);
      Sentry.captureException(error);
    }
  }, [activeMedia, title, t]);

  useEffect(() => {
    // Clean up when component unmounts or media changes
    return () => {
      AudioPro.stop();
    };
  }, []);

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
  const infoButtonStyles = useAnimatedStyle(() => ({
    opacity: withSpring(isOpenSv.value ? 0 : 1, springConfig),
    transform: [
      {
        scale: withSpring(isOpenSv.value ? 0.8 : 1, springConfig),
      },
    ],
  }));
  const closeButtonStyles = useAnimatedStyle(() => ({
    opacity: withSpring(isOpenSv.value ? 1 : 0, springConfig),
    transform: [
      {
        scale: withSpring(isOpenSv.value ? 1 : 0.8, springConfig),
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
      progressSv.value = duration ? position / duration : 0;
    }
  }, [position, duration, isGesturingSv, progressSv]);
  const seekOnGestureFinalize = useCallback(
    (time: number) => {
      AudioPro.seekTo(time * 1000);
      isGesturingSv.value = false;
    },
    [isGesturingSv]
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
      const seekTime = (progressSv.value * (duration || 0)) / 1000;
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
            isOpenSv.value = !isOpenSv.value;
          }}
        >
          <Animated.View style={[infoButtonStyles]}>
            <FontAwesome6 name="info" size={15} color="white" style={{ position: 'relative', top: -1 }} />
          </Animated.View>
          <Animated.View style={[closeButtonStyles, { position: 'absolute' }]}>
            <FontAwesome6 name="chevron-right" size={16} color="white" />
          </Animated.View>
        </Button>

        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              opacityStyles,
              {
                position: 'absolute',
                right:
                  media.length > 1
                    ? padding + buttonWidth + padding + buttonWidth + padding + extraDurationPadding
                    : padding + buttonWidth + padding + extraDurationPadding,
                width: durationWidth,
                top: padding,
                bottom: padding,
                justifyContent: activeMedia['Variant Name'] ? 'space-between' : 'center',
              },
            ]}
          >
            {activeMedia['Variant Name'] ? (
              <ThemedText style={{ color: 'white' }} numberOfLines={1}>
                {activeMedia['Variant Name'].replace('Įrašas', t('media'))}
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

        {media.length > 1 ? (
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
              activeMediaIndex={activeMediaIndex}
              setActiveMediaIndex={setActiveMediaIndex}
            />
          </Animated.View>
        ) : null}

        <Button
          hitSlop={{ top: padding, bottom: padding, right: padding }}
          style={{ position: 'absolute', right: padding, top: padding, bottom: padding }}
          onPress={() => {
            if (!isLoaded) {
              // load
              loadTrack();
            } else if (playing) {
              // pause
              AudioPro.pause();
            } else {
              // play
              loadTrack();
            }
          }}
        >
          {loading ? (
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
