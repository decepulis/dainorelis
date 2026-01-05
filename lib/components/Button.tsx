import { ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import BorderlessButton from '@/lib/components/BorderlessButtonOpacity';

import SystemView from './SystemView';

const glassWidth = 44;
const basicWidth = 32;
const width = isLiquidGlassAvailable() ? glassWidth : basicWidth;
const slop = (44 - width) / 2;
export const buttonSlop = { top: slop, bottom: slop, left: slop, right: slop };

type Props = {
  children: React.ReactNode;
  haptics?: Haptics.ImpactFeedbackStyle;
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
  noGlass?: boolean;
  innerStyle?: StyleProp<ViewStyle>;
} & Omit<ComponentPropsWithoutRef<typeof BorderlessButton>, 'hitSlop'>;

const Button = forwardRef<React.ElementRef<typeof BorderlessButton>, Props>(
  ({ children, onPress: argOnPress, haptics, style, hitSlop: argHitSlop, noGlass, innerStyle, ...rest }, ref) => {
    const onPress = useCallback(
      (pointerInside: boolean) => {
        if (haptics) {
          Haptics.impactAsync(haptics);
        }
        return argOnPress?.(pointerInside);
      },
      [argOnPress, haptics]
    );

    const hitSlop = {
      ...buttonSlop,
      ...argHitSlop,
    };

    const Wrapper = isLiquidGlassAvailable() ? (noGlass ? View : GlassView) : SystemView;

    return (
      // TODO iPad cursor hover styles
      // TODO asymmetrical button ripple radius is a bit funny
      // TODO A11y label
      <BorderlessButton
        ref={ref}
        onPress={onPress}
        rippleRadius={24}
        style={[
          styles.container,
          {
            marginLeft: -hitSlop.left,
            marginRight: -hitSlop.right,
            marginTop: -hitSlop.top,
            marginBottom: -hitSlop.bottom,
            paddingLeft: hitSlop.left,
            paddingRight: hitSlop.right,
            paddingTop: hitSlop.top,
            paddingBottom: hitSlop.bottom,
          },
          style,
        ]}
        {...rest}
      >
        <Wrapper shadow={false} style={[styles.button, innerStyle]}>
          {children}
        </Wrapper>
      </BorderlessButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;

export const styles = StyleSheet.create({
  container: {},
  button: {
    borderRadius: width,
    width: width,
    height: width,
    flexBasis: width,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
