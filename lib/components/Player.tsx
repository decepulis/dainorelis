import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, DynamicColorIOS, Image, StyleProp, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type AnimatedStyle,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/spring';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import FontAwesome6 from "@react-native-vector-icons/fontawesome6/static";

import appPadding from '@/lib/constants/padding';

import maxWidth from '../constants/maxWidth';
import useAccessibilityInfo from '../hooks/useAccessibilityInfo';
import { useThemeColor } from '../hooks/useThemeColor';
import { Audio } from '../schemas/audio';
import Button, { buttonSlop, styles as buttonStyles } from './Button';
import MediaMenu from './MediaMenu';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const artworkUrl = Image.resolveAssetSource(require('@/assets/images/icon.png')).uri;

const padding = isLiquidGlassAvailable() ? 6 : buttonSlop.left + buttonSlop.right;
const extraDurationPadding = padding / 2;
const buttonWidth = buttonStyles.button.width;
export const playerHeight = buttonWidth + 2 * padding;

const springConfig: SpringConfig = {
  mass: 1,
  damping: 30,
  stiffness: 300,
};

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

// TODO figure out a way to fling this around to get it out of the way of PDFs
type Props = {
  title: string;
  media: { [id: string]: Audio };
  activeMediaId: string | undefined;
  setActiveMediaId: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};
export default function Player({ title, media, activeMediaId, setActiveMediaId, style }: Props) {
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();
  const { isHighContrastEnabled } = useAccessibilityInfo();
  const { i18n } = useTranslation();
  const isAppWide = useMemo(() => width > maxWidth, [width]);
  const text = useThemeColor('text');
  const primary = useThemeColor('primary');

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
    [media, playerWidth]
  );

  // Manage media
  const activeMedia = useMemo(() => {
    if (Object.values(media).length === 0) return null;
    return activeMediaId ? media[activeMediaId] : Object.values(media)[0];
  }, [media, activeMediaId]);

  // expo-audio state
  const player = useAudioPlayer(activeMedia?.URL ?? null);
  const { playing, isBuffering: loading, currentTime, duration } = useAudioPlayerStatus(player);

  // Lock screen controls
  useEffect(() => {
    if (activeMedia) {
      const variantName = i18n.language === 'en' ? activeMedia['EN Variant Name'] : activeMedia['Variant Name'];
      player.setActiveForLockScreen(true, { title, artist: variantName, artworkUrl });
    }
  }, [activeMedia, title, i18n.language, player]);

  // Manage animations
  const isOpenSv = useSharedValue(false);
  const containerStyles = useAnimatedStyle(() => ({
    width: withSpring(
      isOpenSv.get() ? playerWidth : padding + buttonWidth + padding + buttonWidth + padding,
      springConfig
    ),
  }));
  const opacityStyles = useAnimatedStyle(() => ({
    opacity: withSpring(isOpenSv.get() ? 1 : 0, springConfig),
    pointerEvents: isOpenSv.get() ? 'auto' : 'none',
  }));
  const infoButtonStyles = useAnimatedStyle(() => ({
    opacity: withSpring(isOpenSv.get() ? 0 : 1, springConfig),
    transform: [
      {
        scale: withSpring(isOpenSv.get() ? 0.8 : 1, springConfig),
      },
    ],
  }));
  const closeButtonStyles = useAnimatedStyle(() => ({
    opacity: withSpring(isOpenSv.get() ? 1 : 0, springConfig),
    transform: [
      {
        scale: withSpring(isOpenSv.get() ? 1 : 0.8, springConfig),
      },
    ],
  }));

  // manage duration / gestures
  const progressSv = useSharedValue(0);
  const gestureStartProgressSv = useSharedValue(0);
  const isGesturingSv = useSharedValue(false);
  const seekTargetSv = useSharedValue<number | null>(null);
  const didBumpSv = useSharedValue(false);

  // sync state with time elapsed
  useEffect(() => {
    if (loading || isGesturingSv.get()) return;
    const target = seekTargetSv.get();
    if (target !== null) {
      // wait for currentTime to catch up to the seek target before unlocking
      if (Math.abs(currentTime - target) < 1) {
        seekTargetSv.set(null);
      }
      return;
    }
    progressSv.set(duration ? currentTime / duration : 0);
  }, [currentTime, duration, isGesturingSv, progressSv, loading, seekTargetSv]);
  const seekOnGestureFinalize = useCallback(
    (time: number) => {
      seekTargetSv.set(time);
      player.seekTo(time);
      isGesturingSv.set(false);
    },
    [isGesturingSv, player, seekTargetSv]
  );

  // override playback state with gesture
  const gesture = Gesture.Pan()
    .hitSlop({ ...buttonSlop, top: padding, bottom: padding })
    .minDistance(5)
    .enabled(duration > 0)
    .onStart(() => {
      isGesturingSv.set(true);
      gestureStartProgressSv.set(progressSv.get());
    })
    .onUpdate((e) => {
      const gestureProgress = e.translationX / durationWidth;
      const newValue = Math.max(0, Math.min(1, gestureStartProgressSv.get() + gestureProgress));
      progressSv.set(newValue);

      // side-effect: bump!
      if (!didBumpSv.get() && (newValue === 0 || newValue === 1)) {
        scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Medium);
        didBumpSv.set(true);
      } else if (didBumpSv.get() && newValue !== 0 && newValue !== 1) {
        // reset state
        didBumpSv.set(false);
      }
    })
    .onEnd(() => {
      const seekTime = progressSv.get() * (duration || 0);
      scheduleOnRN(seekOnGestureFinalize, seekTime);
    });

  // commit gesture stuff to styles
  const durationContainerStyles = useAnimatedStyle(() => ({
    height: withSpring(isGesturingSv.get() ? 12 : 6, { mass: 1, damping: 30, stiffness: 500 }),
  }));
  const durationStyles = useAnimatedStyle(() => ({
    width: `${progressSv.get() * 100}%`,
  }));

  // translate progress to time
  const timeMode = useSharedValue<'elapsed' | 'remaining'>('remaining');
  const [time, setTime] = useState<string>('-0:00');
  useAnimatedReaction(
    () => {
      const timeInSeconds =
        timeMode.get() === 'elapsed' ? progressSv.get() * (duration || 0) : (1 - progressSv.get()) * (duration || 0);
      const minutes = Math.floor(timeInSeconds / 60);
      const seconds = Math.floor(timeInSeconds % 60);
      const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      return timeMode.get() === 'elapsed' ? formattedTime : `-${formattedTime}`;
    },
    (t) => scheduleOnRN(setTime, t)
  );
  // TODO add tap gesture to toggle time mode

  const Wrapper = ({ children, style }: { children: React.ReactNode; style?: StyleProp<AnimatedStyle<ViewStyle>> }) =>
    isLiquidGlassAvailable() ? (
      <AnimatedGlassView isInteractive style={style}>
        {children}
      </AnimatedGlassView>
    ) : (
      <Animated.View
        style={[
          {
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(64, 64, 64, 0.1)',
          },
          style,
        ]}
      >
        <SystemView style={{ flex: 1 }}>{children}</SystemView>
      </Animated.View>
    );
  const color = isLiquidGlassAvailable() ? DynamicColorIOS({ light: '#000', dark: '#fff' }) : '#ffffff';
  const trackColor = isLiquidGlassAvailable()
    ? DynamicColorIOS({ light: `${primary}64`, dark: '#ffffff64' })
    : '#ffffff64';
  const progressColor = isLiquidGlassAvailable() ? primary : '#ffffff';

  return activeMedia ? (
    <Wrapper
      style={[
        containerStyles,
        {
          position: 'absolute',
          bottom: Math.max(inset.bottom, appPadding),
          right: Math.max(inset.right, isAppWide ? appPadding : appPadding / 2),
          height: playerHeight,
          borderRadius: playerHeight / 2,
        },
        style,
      ]}
    >
      <View style={{ overflow: 'hidden', position: 'absolute', inset: 0 }}>
        {/* TODO blocker? why are these not rippling? */}
        <Button
          noGlass
          hitSlop={{ top: padding, bottom: padding, left: padding }}
          style={{ position: 'absolute', left: padding, top: padding, bottom: padding }}
          onPress={() => {
            isOpenSv.set(!isOpenSv.get());
          }}
        >
          <Animated.View style={[infoButtonStyles]}>
            <FontAwesome6
              name="info"
              iconStyle="solid"
              size={isLiquidGlassAvailable() ? 18 : 15}
              color={color}
              style={{ position: 'relative', top: -1 }}
            />
          </Animated.View>
          <Animated.View style={[closeButtonStyles, { position: 'absolute' }]}>
            <FontAwesome6 name="chevron-right" iconStyle="solid" size={isLiquidGlassAvailable() ? 19 : 16} color={color} />
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
                justifyContent: 'center',
                gap: 6,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', gap: padding / 2, justifyContent: 'space-between' }}>
              <ThemedText style={{ color, flexShrink: 1 }} numberOfLines={1}>
                {i18n.language === 'en' ? activeMedia['EN Variant Name'] : activeMedia['Variant Name']}
              </ThemedText>
              <ThemedText
                style={{
                  color,
                  marginLeft: 'auto',
                  opacity: !duration ? 0 : isHighContrastEnabled ? 1 : 0.75,
                }}
                numberOfLines={1}
              >
                {time}
              </ThemedText>
            </View>
            <Animated.View
              style={[
                durationContainerStyles,
                {
                  borderRadius: 9999,
                  overflow: 'hidden',
                },
                isHighContrastEnabled
                  ? {
                      borderColor: trackColor,
                      borderWidth: 1,
                    }
                  : {
                      backgroundColor: trackColor,
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
                    backgroundColor: progressColor,
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
            {/* TODO media menu closes when audio is playing */}
            <MediaMenu
              hitSlop={{ top: padding, bottom: padding }}
              media={media}
              activeMediaId={activeMediaId}
              setActiveMediaId={setActiveMediaId}
              color={color}
            />
          </Animated.View>
        ) : null}

        <Button
          noGlass
          hitSlop={{ top: padding, bottom: padding, right: padding }}
          style={{ position: 'absolute', right: padding, top: padding, bottom: padding }}
          onPress={() => {
            if (playing) {
              player.pause();
            } else {
              player.play();
            }
          }}
        >
          {loading ? (
            <ActivityIndicator color={color} />
          ) : playing ? (
            <FontAwesome6 name="pause" iconStyle="solid" size={isLiquidGlassAvailable() ? 18 : 14} color={color} />
          ) : (
            <FontAwesome6 name="play" iconStyle="solid" size={isLiquidGlassAvailable() ? 18 : 14} color={color} />
          )}
        </Button>
      </View>
    </Wrapper>
  ) : null;
}
