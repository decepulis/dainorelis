import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicColorIOS, LayoutRectangle, View } from 'react-native';
import Animated, {
  AnimatedRef,
  Extrapolation,
  SharedValue,
  WithSpringConfig,
  interpolate,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Link, Stack, useRouter } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import useAccessibilityInfo from '../hooks/useAccessibilityInfo';
import Button, { buttonSlop } from './Button';
import SystemView from './SystemView';
import ThemedText from './ThemedText';

const springConfig: WithSpringConfig = {
  mass: 1,
  damping: 50,
  stiffness: 500,
};

// expo-glass-effect's native constant is already false below iOS 26 (and off iOS), and it's cached
export const isLiquidGlassStyleHeader = () => isLiquidGlassAvailable();

type HeaderBackgroundProps = {
  scrollRef?: AnimatedRef<Animated.ScrollView> | AnimatedRef<Animated.FlatList<any>>;
  /** the screen's own scroll offset, kept up to date here too (see useScrollOffset's providedOffset) */
  scrollOffset?: SharedValue<number>;
  opaque?: boolean;
};

export function HeaderBackground({ scrollRef, scrollOffset: providedScrollOffset, opaque }: HeaderBackgroundProps) {
  // @ts-expect-error useScrollOffset doesn't know this works with flatlist
  const scrollOffset = useScrollOffset(scrollRef ?? null, providedScrollOffset);

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
  /** the screen's own scroll offset, kept up to date here too (see useScrollOffset's providedOffset) */
  scrollOffset?: SharedValue<number>;
  titleLayout?: SharedValue<LayoutRectangle | null>;
  showTitle?: boolean;
  children?: React.ReactNode;
  /**
   * Wraps the title, e.g. in a menu. A render function, not a component: an inline component would be a
   * new type on every render and remount whatever it wraps (the native variant menu).
   */
  titleWrapper?: (title: React.ReactNode) => React.ReactNode;
  title?: string;
  /** the title is a song's, set in the title face (Saira Semi Condensed) */
  isSongTitle?: boolean;
  subtitle?: string;
  variantName?: string;
  center?: boolean;
};
export const HeaderTitle = ({
  scrollRef,
  scrollOffset: providedScrollOffset,
  titleLayout,
  showTitle,
  children,
  titleWrapper,
  title,
  isSongTitle,
  subtitle,
  variantName,
  center,
}: HeaderTitleProps) => {
  const hasTitleWrapper = !!titleWrapper;
  // live Reduce Motion: the title jumps in and out instead of springing
  const { reduceMotion } = useAccessibilityInfo();
  const spring = { ...springConfig, reduceMotion };

  // @ts-expect-error useScrollOffset doesn't know this works with flatlist
  const scrollOffset = useScrollOffset(scrollRef ?? null, providedScrollOffset);

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
      opacity: withSpring(animateTitleIn ? 1 : 0, spring),
      transform: [{ translateY: withSpring(animateTitleIn ? 0 : 5, spring) }],
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
          translateY: withSpring(animateTitleIn ? 0 : -0.5 * subtitleFontSize * subtitleLineHeight, spring),
        },
        {
          scale: withSpring(animateTitleIn ? 1 : titleFontSize / subtitleFontSize, spring),
        },
      ],
    };
  });

  const content = (
    <>
      <Animated.View style={[animatedTitleStyle]}>
        {title ? (
          <ThemedText
            numberOfLines={1}
            bold
            title={isSongTitle}
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
            title
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
              iconStyle="solid"
              size={9}
              color={isLiquidGlassStyleHeader() ? DynamicColorIOS({ light: '#000', dark: '#fff' }) : '#fff'}
              style={{ marginTop: -1 }}
            />
          ) : null}
        </Animated.View>
      ) : null}
    </>
  );

  return (
    <View
      style={[
        {
          flex: center ? undefined : 1,
          // on iOS 26, patches/react-native-screens@4.30.0.patch sizes this view to the space
          // actually left over by the toolbar buttons, so no width hacks are needed here
          paddingHorizontal: isLiquidGlassStyleHeader() ? undefined : buttonSlop.left,
          // web's JS header stretches the title to the bar's height
          justifyContent: process.env.EXPO_OS === 'web' ? 'center' : undefined,
        },
      ]}
    >
      {titleWrapper ? titleWrapper(content) : content}
    </View>
  );
};

// web's JS header puts the bar buttons at its very edges; Android's toolbar insets them
const webBarEdge = process.env.EXPO_OS === 'web' ? 16 : 0;

type HeaderLeftProps = {
  modal?: boolean;
  href?: string;
  canGoBack?: boolean;
};

export const HeaderLeft = ({ modal, href, canGoBack }: HeaderLeftProps) => {
  const { t } = useTranslation();
  const isClose = modal && process.env.EXPO_OS === 'ios';
  // role overrides the 'link' role Link passes down: this is a navigation-bar button
  return (
    <View style={{ marginLeft: webBarEdge }}>
      <Link href={href ?? (canGoBack ? '../' : '/')} asChild>
        <Button role="button" accessibilityLabel={isClose ? t('close') : t('back')}>
          {isClose ? (
            <FontAwesome6 name="xmark" iconStyle="solid" size={18} color="white" />
          ) : (
            <FontAwesome6 name="chevron-left" iconStyle="solid" size={17} color="white" />
          )}
        </Button>
      </Link>
    </View>
  );
};

/** The iOS 26 close button for modals; `back` shows a back chevron instead, for pushed screens */
export function ModalToolbar({ back }: { back?: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  if (!isLiquidGlassStyleHeader()) return null;
  return (
    <Stack.Toolbar placement="left">
      <Stack.Toolbar.Button
        icon={back ? 'chevron.left' : 'xmark'}
        accessibilityLabel={back ? t('back') : t('close')}
        // the root layout's anchor keeps index under a deep-linked screen; fall back to it anyway
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />
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
        marginRight: webBarEdge,
      }}
    >
      {children}
    </View>
  );
};
