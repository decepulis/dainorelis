import React, { useEffect } from 'react';
import { DynamicColorIOS, LayoutRectangle, Platform, View } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SpringConfig } from 'react-native-reanimated/lib/typescript/animation/spring';

import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Link, Stack, router } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import { useThemeColor } from '../hooks/useThemeColor';
import Button, { buttonSlop } from './Button';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const springConfig: SpringConfig = {
  mass: 1,
  damping: 50,
  stiffness: 500,
};

export const isLiquidGlassStyleHeader = () =>
  Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 26 && isLiquidGlassAvailable();

type HeaderBackgroundProps = {
  scrollRef?: AnimatedRef<Animated.ScrollView> | AnimatedRef<Animated.FlatList<any>>;
  opaque?: boolean;
};

export function HeaderBackground({ scrollRef, opaque }: HeaderBackgroundProps) {
  // @ts-expect-error useScrollOffset doesn't know this works with flatlist
  const scrollOffset = useScrollOffset(scrollRef ?? null);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: opaque ? 1 : interpolate(scrollOffset.get(), [0, 40], [0, 1], Extrapolation.CLAMP),
  }));

  if (isLiquidGlassStyleHeader()) {
    return null;
  }

  return (
    <Animated.View style={[{ height: '100%' }, typeof scrollRef !== 'undefined' ? headerStyle : {}]}>
      <SystemView shadow style={{ flex: 1 }}></SystemView>
    </Animated.View>
  );
}

const titleFontSize = isLiquidGlassStyleHeader() ? 17 : 16;
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
  center?: boolean;
  withControls?: boolean;
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
  center,
  withControls,
}: HeaderTitleProps) => {
  const text = useThemeColor('text');

  const TitleWrapper = titleWrapper ?? React.Fragment;
  const hasTitleWrapper = !!titleWrapper;

  // @ts-expect-error useScrollOffset doesn't know this works with flatlist
  const scrollOffset = useScrollOffset(scrollRef ?? null);

  const hasSubtitleOrVariantName = !!subtitle || !!variantName;
  const showSubtitle = !!subtitle && !variantName;

  const showTitleSv = useSharedValue(typeof showTitle === 'boolean' ? showTitle : null);
  useEffect(() => {
    if (typeof showTitle === 'boolean') {
      showTitleSv.set(showTitle);
    } else {
      showTitleSv.set(null);
    }
  }, [showTitle, showTitleSv]);

  const animatedTitleStyle = useAnimatedStyle(() => {
    // default to whatever the prop dragged in
    let animateTitleIn = showTitleSv.get();
    // if the prop is null, we need to calculate it
    if (animateTitleIn === null) {
      const layoutValue = titleLayout?.get();
      if (layoutValue) {
        animateTitleIn = scrollOffset.get() > layoutValue.y + layoutValue.height;
      }
    }
    return {
      opacity: withSpring(animateTitleIn ? 1 : 0, springConfig),
      transform: [{ translateY: withSpring(animateTitleIn ? 0 : 5, springConfig) }],
    };
  });
  const animatedVariantNameStyle = useAnimatedStyle(() => {
    // default to whatever the prop dragged in
    let animateTitleIn = showTitleSv.get();
    // if the prop is null, we need to calculate it
    if (animateTitleIn === null) {
      const layoutValue = titleLayout?.get();
      if (layoutValue) {
        animateTitleIn = scrollOffset.get() > layoutValue.y + layoutValue.height;
      }
    }
    return {
      transform: [
        {
          translateY: withSpring(animateTitleIn ? 0 : -0.5 * subtitleFontSize * subtitleLineHeight, springConfig),
        },
        {
          scale: withSpring(animateTitleIn ? 1 : titleFontSize / subtitleFontSize, springConfig),
        },
      ],
    };
  });

  return (
    <View
      style={[
        {
          flex: center ? undefined : 1,
          // This is an unfortunate hack while I wait on https://github.com/software-mansion/react-native-screens/pull/3210
          marginRight: center ? undefined : isLiquidGlassStyleHeader() ? (withControls ? 135 : 65) : 0,
          paddingHorizontal: isLiquidGlassStyleHeader() ? undefined : buttonSlop.left,
        },
      ]}
    >
      <TitleWrapper>
        <Animated.View style={[animatedTitleStyle]}>
          {title ? (
            <ThemedText
              numberOfLines={1}
              bold
              style={[
                {
                  fontSize: hasSubtitleOrVariantName ? titleWithSubtitleFontSize : titleFontSize,
                  lineHeight: hasSubtitleOrVariantName
                    ? titleWithSubtitleFontSize * titleWithSubtitleLineHeight
                    : titleFontSize * titleLineHeight,
                  textAlign: 'left',
                  position: 'relative',
                  top: !variantName ? 1 : 0,
                },
                isLiquidGlassStyleHeader()
                  ? {
                      color: DynamicColorIOS({ light: '#000', dark: '#fff' }),
                    }
                  : { color: '#fff' },
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
                  textAlign: 'left',
                  position: 'relative',
                  top: 0,
                },
                isLiquidGlassStyleHeader()
                  ? {
                      color: DynamicColorIOS({ light: '#000', dark: '#fff' }),
                    }
                  : { color: '#fff' },
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
                transformOrigin: 'left center',
                justifyContent: 'flex-start',
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
                  textAlign: 'left',
                  position: 'relative',
                  top: 0,
                },
                isLiquidGlassStyleHeader()
                  ? {
                      color: DynamicColorIOS({ light: '#000', dark: '#fff' }),
                    }
                  : { color: '#fff' },
              ]}
            >
              {variantName}
            </ThemedText>
            {hasTitleWrapper ? (
              <FontAwesome6
                name="circle-chevron-down"
                size={9}
                color={isLiquidGlassStyleHeader() ? DynamicColorIOS({ light: '#000', dark: '#fff' }) : '#fff'}
                style={{ marginTop: -1 }}
              />
            ) : null}
          </Animated.View>
        ) : null}
      </TitleWrapper>
    </View>
  );
};

type HeaderLeftProps = {
  modal?: boolean;
  href?: string;
  canGoBack?: boolean;
};

export const HeaderLeft = ({ modal, href, canGoBack }: HeaderLeftProps) => {
  return (
    <Link href={href || canGoBack ? '../' : '/'} asChild>
      <Button>
        {modal && Platform.OS === 'ios' ? (
          <FontAwesome6 name="xmark" size={18} color="white" />
        ) : (
          <FontAwesome6 name="chevron-left" size={17} color="white" />
        )}
      </Button>
    </Link>
  );
};

export function ModalToolbar() {
  if (!isLiquidGlassStyleHeader()) return null;
  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button icon="xmark" onPress={() => router.navigate('../')} />
    </Stack.Toolbar>
  );
}

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
