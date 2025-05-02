import React from 'react';
import { LayoutRectangle, Platform, StyleSheet, View } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedScrollView } from 'react-native-reanimated/lib/typescript/component/ScrollView';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FontAwesome6 } from '@expo/vector-icons';

import useDefaultHeaderHeight from '@/lib/hooks/useDefaultHeaderHeight';

import Button from './Button';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const timing = {
  duration: 150,
};

interface HeaderProps {
  scrollRef?: AnimatedRef<AnimatedScrollView>;
  titleLayout?: SharedValue<LayoutRectangle | null>;
  children?: React.ReactNode;
  title?: string[];
  controls?: React.ReactNode;
  center?: boolean;
  hideBack?: boolean;
  opaque?: boolean;
  shadow?: boolean;
}
export default function Header({
  scrollRef,
  titleLayout,
  children,
  title,
  controls,
  center,
  hideBack,
  opaque,
  shadow = true,
}: HeaderProps) {
  const inset = useSafeAreaInsets();
  const defaultHeaderHeight = useDefaultHeaderHeight();
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);
  const canGoBack = router.canGoBack();
  const align = Platform.OS === 'ios' && inset.top >= 30 ? 'flex-start' : 'center';

  const animatedTitleStyle = useAnimatedStyle(() => {
    let isTitleBehind = true;
    if (titleLayout?.value) {
      isTitleBehind = scrollOffset.value > titleLayout.value.y + titleLayout.value.height;
    }
    return {
      opacity: withTiming(isTitleBehind ? 1 : 0, timing),
      transform: [{ translateY: withTiming(isTitleBehind ? 0 : 5, timing) }],
    };
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: opaque ? 1 : interpolate(scrollOffset.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {hideBack ? null : (
        <View
          style={[
            styles.buttonContainer,
            styles.backButtonContainer,
            {
              top: inset.top,
              alignItems: align,
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
          shadow={shadow}
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
                justifyContent: align,
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
              alignItems: align,
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
    // TODO: align title with content on android tablet
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
