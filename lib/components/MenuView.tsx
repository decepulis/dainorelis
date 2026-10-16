import { useState } from 'react';
import { View } from 'react-native';

import { type MenuComponentProps, MenuView as UIMenuView } from '@expo/ui/community/menu';

import { useColorScheme } from '@/lib/hooks/useColorScheme';

import { buttonSlop } from './Button';

export type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';

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
} & Omit<MenuComponentProps, 'colorScheme'>;

/**
 * Native menu (SwiftUI Menu on iOS, Compose DropdownMenu on Android) with the app's hit slop
 * and color scheme applied.
 */
export default function MenuView({ hitSlop: argHitSlop, children, style, onOpenMenu, onCloseMenu, ...props }: Props) {
  const colorScheme = useColorScheme();
  const hitSlop = {
    ...buttonSlop,
    ...argHitSlop,
  };

  // only fires on Android; SwiftUI menus don't report open/close
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <UIMenuView
      colorScheme={colorScheme}
      style={{
        marginLeft: -hitSlop.left,
        marginRight: -hitSlop.right,
        marginTop: -hitSlop.top,
        marginBottom: -hitSlop.bottom,
      }}
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
      <View
        style={[
          {
            paddingLeft: hitSlop.left,
            paddingRight: hitSlop.right,
            paddingTop: hitSlop.top,
            paddingBottom: hitSlop.bottom,
            opacity: isMenuOpen ? 0.5 : 1,
          },
          style,
        ]}
      >
        {children}
      </View>
    </UIMenuView>
  );
}
