import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';

import Description from '@expo/material-symbols/description.xml';
import FormatQuote from '@expo/material-symbols/format_quote.xml';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import maxWidth from '../constants/maxWidth';
import appPadding from '../constants/padding';
import useAccessibilityInfo from '../hooks/useAccessibilityInfo';
import { useThemeColor } from '../hooks/useThemeColor';
import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import isLyrics from '../utils/isLyrics';
import { ButtonSurface } from './Button';
import MenuView from './MenuView';
import { playerHeight } from './Player';
import ThemedText from './ThemedText';

// the Liquid Glass toolbar's own margins around a full-width item
const toolbarMargin = 26;

type Props = {
  variants: { [id: string]: Lyrics | PDFs };
  activeVariantId: string;
  setActiveVariantId: (id: string) => void;
  /** renders the player at the given open width, or null when the song has no recordings */
  renderPlayer: ((openWidth: number) => React.ReactElement) | null;
  isPlayerOpen: boolean;
};

/**
 * The song screen's bottom bar: the variant pop-up on the leading side, the player on the trailing
 * side (it grows over the pop-up when opened). On Liquid Glass it sits in the native bottom
 * toolbar as one fixed-size item, so the toolbar never re-measures it and the player keeps its
 * spring; elsewhere it floats above the bottom safe area like the home screen's pills.
 */
export default function SongBottomBar({
  variants,
  activeVariantId,
  setActiveVariantId,
  renderPlayer,
  isPlayerOpen,
}: Props) {
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();
  const { reduceMotion } = useAccessibilityInfo();
  const [popUpWidth, setPopUpWidth] = useState(0);
  const hasMultipleVariants = Object.keys(variants).length > 1;
  if (!hasMultipleVariants && !renderPlayer) return null;

  const isGlass = isLiquidGlassAvailable();
  // the toolbar lays out inside the safe area (e.g. clear of the iPhone Duo's trailing bar), then adds its margins
  const leading = isGlass ? inset.left + toolbarMargin : Math.max(inset.left, appPadding / 2);
  const trailing = isGlass ? inset.right + toolbarMargin : Math.max(inset.right, appPadding / 2);
  // the pop-up and player sit in the bottom corners, like the home screen's pills
  const barWidth = width - leading - trailing;
  // on wide windows the open player stops at the width it has on a phone
  const openWidth = width > maxWidth ? Math.min(360, barWidth) : barWidth;

  const content = (
    <View style={{ width: barWidth, height: playerHeight }}>
      {hasMultipleVariants ? (
        <VariantPopUp
          variants={variants}
          activeVariantId={activeVariantId}
          setActiveVariantId={setActiveVariantId}
          // only when the open player would reach it (a wide window has room for both)
          hidden={isPlayerOpen && openWidth + appPadding / 2 > barWidth - popUpWidth}
          onWidth={setPopUpWidth}
          reduceMotion={reduceMotion}
        />
      ) : null}
      {renderPlayer ? (
        <View style={{ position: 'absolute', right: 0, top: 0, bottom: 0 }}>{renderPlayer(openWidth)}</View>
      ) : null}
    </View>
  );

  if (isGlass) {
    return (
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.View hidesSharedBackground>{content}</Stack.Toolbar.View>
      </Stack.Toolbar>
    );
  }
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        bottom: Math.max(inset.bottom, appPadding),
        left: leading,
        right: trailing,
      }}
    >
      {content}
    </View>
  );
}

type VariantPopUpProps = {
  variants: { [id: string]: Lyrics | PDFs };
  activeVariantId: string;
  setActiveVariantId: (id: string) => void;
  hidden: boolean;
  onWidth: (width: number) => void;
  reduceMotion: ReturnType<typeof useAccessibilityInfo>['reduceMotion'];
};

/** A pop-up button (HIG): it shows the current selection and an indicator that it opens a menu */
function VariantPopUp({
  variants,
  activeVariantId,
  setActiveVariantId,
  hidden,
  onWidth,
  reduceMotion,
}: VariantPopUpProps) {
  const { t, i18n } = useTranslation();
  const isGlass = isLiquidGlassAvailable();
  const text = useThemeColor('text');
  const color = isGlass ? text : '#ffffff';
  const name = (variant: Lyrics | PDFs) =>
    i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name'];

  const actions: MenuAction[] = Object.entries(variants).map(([id, variant]) => ({
    id,
    title: name(variant),
    state: activeVariantId === id ? 'on' : 'off',
    image: isLyrics(variant)
      ? process.env.EXPO_OS === 'ios'
        ? 'text.quote'
        : FormatQuote
      : process.env.EXPO_OS === 'ios'
        ? 'document'
        : Description,
  }));

  // the opening player grows over the pop-up, which shrinks away from it (like the home screen's playlist pill)
  const hiddenStyle = useAnimatedStyle(() => {
    const spring = { mass: 1, damping: 30, stiffness: 400, reduceMotion };
    return {
      transform: [{ scale: withSpring(hidden ? 0 : 1, spring) }],
      left: withSpring(hidden ? appPadding * 0.75 : 0, spring),
    };
  });

  const label = (
    <View
      style={{
        height: playerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: appPadding / 3,
        paddingHorizontal: playerHeight / 3,
      }}
    >
      <ThemedText bold={!isGlass} numberOfLines={1} style={{ fontSize: 17, color }}>
        {name(variants[activeVariantId])}
      </ThemedText>
      {isGlass ? (
        <Image source="sf:chevron.up.chevron.down" style={{ width: 11, height: 15 }} tintColor={color} />
      ) : (
        <FontAwesome6 name="chevron-up" iconStyle="solid" color={color} size={12} style={{ marginTop: 2 }} />
      )}
    </View>
  );

  return (
    <Animated.View
      pointerEvents={hidden ? 'none' : 'auto'}
      onLayout={(e) => onWidth(e.nativeEvent.layout.width)}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      style={[{ position: 'absolute', left: 0, top: 0, bottom: 0 }, hiddenStyle]}
    >
      <MenuView
        hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
        actions={actions}
        onPressAction={({ nativeEvent }: NativeActionEvent) => setActiveVariantId(nativeEvent.event)}
        title={t('variantsMenuTitle')}
        accessibilityLabel={t('variantsMenuTitle')}
        accessibilityHint={t('variantsMenuHint')}
      >
        {isGlass ? (
          <GlassView isInteractive style={{ borderRadius: playerHeight / 2 }}>
            {label}
          </GlassView>
        ) : (
          <ButtonSurface style={{ borderRadius: playerHeight / 2, overflow: 'hidden' }}>{label}</ButtonSurface>
        )}
      </MenuView>
    </Animated.View>
  );
}
