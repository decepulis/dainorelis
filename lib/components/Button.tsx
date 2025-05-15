import { ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import * as Haptics from 'expo-haptics';

import SystemView from './SystemView';

export const buttonSlop = { top: 6, bottom: 6, left: 6, right: 6 };

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
} & Omit<ComponentPropsWithoutRef<typeof BorderlessButton>, 'hitSlop'>;

const Button = forwardRef<React.ElementRef<typeof BorderlessButton>, Props>(
  ({ children, onPress: argOnPress, haptics, style, hitSlop: argHitSlop, ...rest }, ref) => {
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

    return (
      // TODO A11y label
      <BorderlessButton
        ref={ref}
        onPress={onPress}
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
        <SystemView variant="primary" shadow={false} style={styles.button}>
          {children}
        </SystemView>
      </BorderlessButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;

const width = 32;
export const styles = StyleSheet.create({
  container: {},
  button: {
    borderRadius: width,
    width: width,
    height: width,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
