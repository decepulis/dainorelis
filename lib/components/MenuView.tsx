import { useState } from 'react';
import { Platform, StyleSheet, View, type ViewStyle, useWindowDimensions } from 'react-native';

import { type MenuComponentProps, MenuView as UIMenuView } from '@expo/ui/community/menu';
import { Rectangle } from '@expo/ui/swift-ui';
import { frame, opacity } from '@expo/ui/swift-ui/modifiers';

import { useColorScheme } from '@/lib/hooks/useColorScheme';

import { buttonSlop } from './Button';

export type { MenuAction } from '@expo/ui/community/menu';

// Before iOS 26, at the accessibility text sizes (React Native's font scale passes 1.4 only there), SwiftUI's menu
// button loses the React Native view hosted as its label: the label's container stays empty and the trigger vanishes
const losesHostedLabel = (fontScale: number) =>
  process.env.EXPO_OS === 'ios' && parseInt(String(Platform.Version), 10) < 26 && fontScale > 1.4;

type Props = {
  /**
   * implemented with negative margin and positive padding so the touch target is real layout
   * (at the cost of fiddliness)
   */
  hitSlop?: Partial<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>;
  /**
   * screen reader name for the trigger; without it, the trigger's text children are read instead.
   * @expo/ui leaves the trigger to declare its own accessibility (its Android Pressable is
   * `accessible={false}`), so it goes on our wrapper View, the element that takes focus
   */
  accessibilityLabel?: string;
  accessibilityHint?: string;
} & Omit<MenuComponentProps, 'colorScheme'>;

/**
 * Native menu (SwiftUI Menu on iOS, Compose DropdownMenu on Android) with the app's hit slop
 * and color scheme applied.
 */
export default function MenuView({
  hitSlop: argHitSlop,
  children,
  style,
  onOpenMenu,
  onCloseMenu,
  accessibilityLabel,
  accessibilityHint,
  ...props
}: Props) {
  const colorScheme = useColorScheme();
  const { fontScale } = useWindowDimensions();
  const hitSlop = {
    ...buttonSlop,
    ...argHitSlop,
  };

  // only fires on Android; SwiftUI menus don't report open/close
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // there, the trigger is drawn by React Native and the menu laid over it with an invisible label of its size
  const [size, setSize] = useState({ width: 0, height: 0 });
  const isOverlaid = losesHostedLabel(fontScale);

  const margins = {
    marginLeft: -hitSlop.left,
    marginRight: -hitSlop.right,
    marginTop: -hitSlop.top,
    marginBottom: -hitSlop.bottom,
  };
  const menu = (trigger: React.ReactNode, menuStyle: ViewStyle) => (
    <UIMenuView
      colorScheme={colorScheme}
      style={menuStyle}
      onOpenMenu={() => {
        setIsMenuOpen(true);
        onOpenMenu?.();
      }}
      onCloseMenu={() => {
        setIsMenuOpen(false);
        onCloseMenu?.();
      }}
      {...props}
    >
      {trigger}
    </UIMenuView>
  );
  const content = (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onLayout={
        isOverlaid
          ? ({ nativeEvent: { layout } }) => setSize({ width: layout.width, height: layout.height })
          : undefined
      }
      style={[
        {
          paddingLeft: hitSlop.left,
          paddingRight: hitSlop.right,
          paddingTop: hitSlop.top,
          paddingBottom: hitSlop.bottom,
          opacity: isMenuOpen ? 0.5 : 1,
        },
        isOverlaid && margins,
        style,
      ]}
    >
      {children}
      {/* on top, the menu's button takes the touches, a screen reader's activation among them */}
      {isOverlaid ? menu(<Rectangle modifiers={[frame(size), opacity(0)]} />, StyleSheet.absoluteFill) : null}
    </View>
  );

  return isOverlaid ? content : menu(content, margins);
}
