import React, { useEffect } from 'react';
import { LayoutRectangle, Platform, View } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useScrollViewOffset,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FontAwesome6 } from '@expo/vector-icons';
import { NativeStackHeaderLeftProps } from '@react-navigation/native-stack';

import Button, { buttonSlop } from './Button';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const timing = {
  duration: 200,
};

type HeaderBackgroundProps = {
  scrollRef?: AnimatedRef<Animated.ScrollView> | AnimatedRef<Animated.FlatList<any>>;
  opaque?: boolean;
  shadow?: boolean;
};

export function HeaderBackground({ scrollRef, opaque, shadow = true }: HeaderBackgroundProps) {
  // @ts-expect-error useScrollViewOffset doesn't know this works with flatlist
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: opaque ? 1 : interpolate(scrollOffset.value, [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[{ height: '100%' }, typeof scrollRef !== 'undefined' ? headerStyle : {}]}>
      <StatusBar style="light" />
      <SystemView variant="primary" shadow={shadow} style={{ flex: 1 }}></SystemView>
    </Animated.View>
  );
}

const titleFontSize = 16;
const titleLineHeight = 1.65;
const titleWithSubtitleFontSize = 15;
const titleWithSubtitleLineHeight = 1.25;
const subtitleFontSize = 13;
const subtitleLineHeight = 1.25;

type HeaderTitleProps = {
  scrollRef?: AnimatedRef<Animated.ScrollView> | AnimatedRef<Animated.FlatList<any>>;
  titleLayout?: SharedValue<LayoutRectangle | null>;
  showTitle?: boolean;
  children?: React.ReactNode;
  titleWrapper?: React.FC<{ children: React.ReactNode }>;
  title?: string;
  subtitle?: string;
  variantName?: string;
};
export const HeaderTitle = ({
  scrollRef,
  titleLayout,
  showTitle,
  children,
  titleWrapper,
  title,
  subtitle,
  variantName,
}: HeaderTitleProps) => {
  const TitleWrapper = titleWrapper ?? React.Fragment;
  const hasTitleWrapper = !!titleWrapper;

  // @ts-expect-error useScrollViewOffset doesn't know this works with flatlist
  const scrollOffset = useScrollViewOffset(scrollRef ?? null);

  const hasSubtitleOrVariantName = !!subtitle || !!variantName;
  const showSubtitle = !!subtitle && !variantName;

  const showTitleSv = useSharedValue(typeof showTitle === 'boolean' ? showTitle : null);
  useEffect(() => {
    if (typeof showTitle === 'boolean') {
      showTitleSv.value = showTitle;
    } else {
      showTitleSv.value = null;
    }
  }, [showTitle, showTitleSv]);

  const animatedTitleStyle = useAnimatedStyle(() => {
    // default to whatever the prop dragged in
    let animateTitleIn = showTitleSv.value;
    // if the prop is null, we need to calculate it
    if (animateTitleIn === null) {
      if (titleLayout?.value) {
        animateTitleIn = scrollOffset.value > titleLayout.value.y + titleLayout.value.height;
      }
    }
    return {
      opacity: withTiming(animateTitleIn ? 1 : 0, timing),
      transform: [{ translateY: withTiming(animateTitleIn ? 0 : 5, timing) }],
    };
  });
  const animatedVariantNameStyle = useAnimatedStyle(() => {
    // default to whatever the prop dragged in
    let animateTitleIn = showTitleSv.value;
    // if the prop is null, we need to calculate it
    if (animateTitleIn === null) {
      if (titleLayout?.value) {
        animateTitleIn = scrollOffset.value > titleLayout.value.y + titleLayout.value.height;
      }
    }
    return {
      transform: [
        {
          translateY: withTiming(animateTitleIn ? 0 : -0.5 * subtitleFontSize * subtitleLineHeight, timing),
        },
        {
          scale: withTiming(animateTitleIn ? 1 : titleFontSize / subtitleFontSize, timing),
        },
      ],
    };
  });

  return (
    <View style={{ paddingHorizontal: buttonSlop.left }}>
      <TitleWrapper>
        <Animated.View style={[animatedTitleStyle]}>
          {title ? (
            <ThemedText
              numberOfLines={hasSubtitleOrVariantName ? 1 : 2}
              bold
              style={[
                {
                  fontSize: hasSubtitleOrVariantName ? titleWithSubtitleFontSize : titleFontSize,
                  lineHeight: hasSubtitleOrVariantName
                    ? titleWithSubtitleFontSize * titleWithSubtitleLineHeight
                    : titleFontSize * titleLineHeight,
                  textAlign: Platform.select({ ios: 'center', default: 'left' }),
                  position: 'relative',
                  top: !variantName ? 1 : 0,
                  color: '#fff',
                },
              ]}
            >
              {title}
            </ThemedText>
          ) : typeof children === 'string' ? (
            <ThemedText>{children}</ThemedText>
          ) : (
            children
          )}
          {showSubtitle ? (
            <ThemedText
              numberOfLines={1}
              style={[
                {
                  fontSize: subtitleFontSize,
                  lineHeight: subtitleFontSize * subtitleLineHeight,
                  textAlign: Platform.select({ ios: 'center', default: 'left' }),
                  position: 'relative',
                  top: 0,
                  color: '#fff',
                },
              ]}
            >
              {subtitle}
            </ThemedText>
          ) : null}
        </Animated.View>
        {variantName ? (
          <Animated.View
            style={[
              animatedVariantNameStyle,
              {
                // width: '100%',
                flexDirection: 'row',
                alignItems: 'center',
                transformOrigin: Platform.select({ ios: 'center', default: 'left center' }),
                justifyContent: Platform.select({ ios: 'center', default: 'flex-start' }),
                gap: 4,
              },
            ]}
          >
            <ThemedText
              numberOfLines={1}
              style={[
                {
                  fontSize: subtitleFontSize,
                  lineHeight: subtitleFontSize * subtitleLineHeight,
                  textAlign: Platform.select({ ios: 'center', default: 'left' }),
                  position: 'relative',
                  top: 0,
                  color: '#fff',
                },
              ]}
            >
              {variantName}
            </ThemedText>
            {hasTitleWrapper ? <FontAwesome6 name="caret-down" size={10} color="white" /> : null}
          </Animated.View>
        ) : null}
      </TitleWrapper>
    </View>
  );
};

type HeaderLeftProps = {
  modal?: boolean;
} & NativeStackHeaderLeftProps;

export const HeaderLeft = ({ modal, href, canGoBack }: HeaderLeftProps) => {
  return (
    <Link href={href || canGoBack ? '../' : '/'} asChild>
      <Button>
        {modal ? (
          <FontAwesome6 name="xmark" size={18} color="white" />
        ) : (
          <FontAwesome6 name="chevron-left" size={17} color="white" />
        )}
      </Button>
    </Link>
  );
};

const gap = buttonSlop.left + buttonSlop.right;

type HeaderButtonContainerProps = {
  children?: React.ReactNode;
};
export const HeaderButtonContainer = ({ children }: HeaderButtonContainerProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap,
      }}
    >
      {children}
    </View>
  );
};
