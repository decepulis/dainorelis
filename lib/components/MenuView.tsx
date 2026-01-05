import { ComponentPropsWithoutRef, useState } from 'react';
import { View } from 'react-native';

import { MenuView as LibMenuView } from '@react-native-menu/menu';

import { buttonSlop, styles as buttonStyles } from './Button';

type Props = {
  /**
   * don't mistake this for the hitSlop prop on BorderlessButton
   * it's implemented with negative margin and positive padding to improve performance
   * (at the cost of fiddliness)
   */
  hitSlop?: Partial<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>;
} & Omit<ComponentPropsWithoutRef<typeof LibMenuView>, 'hitSlop'>;

const MenuView = ({ hitSlop: argHitSlop, children, style, onOpenMenu, onCloseMenu, ...props }: Props) => {
  const hitSlop = {
    ...buttonSlop,
    ...argHitSlop,
  };
  const hitSlopMargin = {
    marginLeft: -hitSlop.left,
    marginRight: -hitSlop.right,
    marginTop: -hitSlop.top,
    marginBottom: -hitSlop.bottom,
  };
  const hitSlopPadding = {
    paddingLeft: hitSlop.left,
    paddingRight: hitSlop.right,
    paddingTop: hitSlop.top,
    paddingBottom: hitSlop.bottom,
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // TODO ripple
  return (
    // TODO this hit slop thing doesn't work on android. the nested view is a misguided attempt to solve it
    <LibMenuView
      hitSlop={hitSlop}
      style={[hitSlopMargin]}
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
      <View style={[buttonStyles.container, hitSlopPadding, { opacity: isMenuOpen ? 0.5 : 1 }, style]}>{children}</View>
    </LibMenuView>
  );
};
export default MenuView;
