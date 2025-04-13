import { ComponentPropsWithoutRef, forwardRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import SystemView from './SystemView';

type Props = {
  children: React.ReactNode;
} & ComponentPropsWithoutRef<typeof Pressable>;

const Button = forwardRef<React.ElementRef<typeof Pressable>, Props>((props, ref) => {
  const { children, ...rest } = props;

  return (
    <Pressable hitSlop={28} ref={ref} {...rest}>
      <SystemView variant="primary" shadow={false} style={styles.container}>
        {children}
      </SystemView>
    </Pressable>
  );
});

Button.displayName = 'Button';

export default Button;

export const styles = StyleSheet.create({
  container: {
    borderRadius: 28,
    width: 28,
    height: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
