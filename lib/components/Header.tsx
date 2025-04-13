import React, { ComponentPropsWithoutRef, useCallback, useEffect, useMemo, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link, router, usePathname } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';
import throttle from 'just-throttle';

import useDefaultHeaderHeight from '@/lib/hooks/useDefaultHeaderHeight';

import { fonts } from '../constants/themes';
import Button from './Button';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const timing = {
  duration: 150,
};

export function useHeaderScroll(titleRef: React.RefObject<View>) {
  const defaultHeaderHeight = useDefaultHeaderHeight();
  const [isTitleBehind, setIsTitleBehind] = useState(false);

  const scrollHandler: ComponentPropsWithoutRef<typeof Animated.ScrollView>['onScroll'] = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const titleEl = titleRef.current;
      if (titleEl) {
        const scrollY = e.nativeEvent.contentOffset.y;
        // todo should probably do this with an onlayout...
        titleEl.measure((_x, _y, _width, titleHeight, _pageX, pageY) => {
          if (pageY + titleHeight - defaultHeaderHeight > scrollY) setIsTitleBehind(false);
          else setIsTitleBehind(true);
        });
      }
    },
    [defaultHeaderHeight, titleRef]
  );

  return useMemo(
    () => ({ scrollHandler: throttle(scrollHandler, 100), isTitleBehind }),
    [scrollHandler, isTitleBehind]
  );
}

interface HeaderProps {
  scrollRef?: AnimatedRef<AnimatedScrollView>;
  children?: React.ReactNode;
  title?: string[];
  controls?: React.ReactNode;
  isTitleBehind?: boolean;
  center?: boolean;
  hideBack?: boolean;
}
export default function Header({
  scrollRef,
  children,
  title,
  controls,
  isTitleBehind = true,
  center,
  hideBack,
}: HeaderProps) {
  const inset = useSafeAreaInsets();
  const defaultHeaderHeight = useDefaultHeaderHeight();
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);
  const canGoBack = router.canGoBack();

  const titleSv = useSharedValue(isTitleBehind);
  useEffect(() => {
    titleSv.value = isTitleBehind;
  }, [isTitleBehind, titleSv]);

  const animatedTitleStyle = useAnimatedStyle(() => ({
    opacity: withTiming(titleSv.value && (typeof scrollRef === 'undefined' || scrollOffset.value) ? 1 : 0, timing),
    transform: [{ translateY: withTiming(titleSv.value ? 0 : 5, timing) }],
  }));

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.container}>
      {hideBack ? null : (
        <View
          style={[
            styles.buttonContainer,
            styles.backButtonContainer,
            {
              top: inset.top,
              alignItems: inset.top ? 'flex-start' : 'center',
            },
          ]}
        >
          <Link href={canGoBack ? '../' : '/'} asChild>
            <Button>
              <FontAwesome6 name="chevron-left" size={18} color="white" />
            </Button>
          </Link>
        </View>
      )}
      <Animated.View style={typeof scrollRef !== 'undefined' ? headerStyle : undefined}>
        <SystemView
          variant="primary"
          style={[
            styles.background,
            {
              height: defaultHeaderHeight,
              paddingTop: inset.top,
            },
          ]}
        >
          {/* TODO the title will be too wide when >1 button is used */}
          {/* TODO dynamically decide how many buttons fit */}
          <Animated.View
            style={[
              animatedTitleStyle,
              styles.titleContainer,
              {
                top: inset.top,
                // this results in text too high on iOS, even if it is technically correct
                justifyContent: inset.top ? 'flex-start' : 'center',
                alignItems: center ? 'center' : Platform.select({ default: 'center', android: 'flex-start' }),
              },
            ]}
          >
            {title
              ? title.map((part, index) => (
                  <ThemedText
                    key={index}
                    numberOfLines={title.length === 1 && index === 0 ? 2 : 1}
                    bold={index === 0}
                    style={[
                      {
                        fontSize: title.length === 1 ? 17 : index === 0 ? 16 : 14,
                        lineHeight: title.length === 1 ? 28 : index === 0 ? 16 * 1.25 : 14 * 1.25,
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
              : children}
          </Animated.View>
        </SystemView>
      </Animated.View>
      {controls && (
        <View
          style={[
            styles.buttonContainer,
            styles.controlsContainer,
            {
              top: inset.top,
              alignItems: inset.top ? 'flex-start' : 'center',
            },
          ]}
        >
          {controls}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'relative',
  },
  titleContainer: {
    position: 'absolute',
    left: 70,
    right: 70,
    bottom: 0,
    flexDirection: 'column',
  },
  buttonContainer: {
    position: 'absolute',
    zIndex: 1,
    bottom: 0,
    justifyContent: 'flex-end',
    flexDirection: 'row',
    gap: 14,
  },
  backButtonContainer: {
    left: 20,
  },
  controlsContainer: {
    right: 20,
  },
});
