import { ComponentPropsWithoutRef } from 'react';
import { View } from 'react-native';

import { MenuView as LibMenuView } from '@react-native-menu/menu';

import { buttonSlop, styles as buttonStyles } from './Button';
import SystemView from './SystemView';

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
  asButton?: boolean;
} & Omit<ComponentPropsWithoutRef<typeof LibMenuView>, 'hitSlop'>;

const MenuView = ({ hitSlop: argHitSlop, asButton, children, style, ...props }: Props) => {
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

  // TODO ripple
  return (
    // TODO this hit slop thing doesn't work on android. the nested view is a misguided attempt to solve it
    <LibMenuView hitSlop={hitSlop} style={[hitSlopMargin]} {...props}>
      <View style={[buttonStyles.container, hitSlopPadding, style]}>
        {asButton ? (
          <SystemView shadow={false} style={[buttonStyles.button]}>
            {children}
          </SystemView>
        ) : (
          children
        )}
      </View>
    </LibMenuView>
  );
};
export default MenuView;
