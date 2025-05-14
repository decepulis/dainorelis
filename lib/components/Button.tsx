import { ComponentPropsWithoutRef, forwardRef, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { BorderlessButton } from 'react-native-gesture-handler';

import * as Haptics from 'expo-haptics';

import SystemView from './SystemView';

export const buttonSlop = { top: 14, bottom: 14, left: 5, right: 5 };

type Props = {
  children: React.ReactNode;
  haptics?: Haptics.ImpactFeedbackStyle;
} & ComponentPropsWithoutRef<typeof BorderlessButton>;

const Button = forwardRef<React.ElementRef<typeof BorderlessButton>, Props>(
  ({ children, onPress: argOnPress, haptics, hitSlop: argHitSlop, ...rest }, ref) => {
    const onPress = useCallback(
      (pointerInside: boolean) => {
        if (haptics) {
          Haptics.impactAsync(haptics);
        }
        return argOnPress?.(pointerInside);
      },
      [argOnPress, haptics]
    );

    return (
      // TODO A11y label
      // TODO why is this so not stylish on iOS?
      <BorderlessButton
        hitSlop={
          typeof argHitSlop === 'number'
            ? argHitSlop
            : {
                ...buttonSlop,
                ...argHitSlop,
              }
        }
        ref={ref}
        onPress={onPress}
        {...rest}
      >
        <SystemView variant="primary" shadow={false} style={styles.container}>
          {children}
        </SystemView>
      </BorderlessButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;

export const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    width: 32,
    height: 32,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
