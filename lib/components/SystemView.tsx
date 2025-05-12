import { forwardRef } from 'react';
import { Platform, StyleProp, View, ViewStyle, useColorScheme } from 'react-native';

import { BlurView } from 'expo-blur';

import { useThemeColor } from '../hooks/useThemeColor';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant: 'primary' | 'background';
  shadow?: boolean;
} & BlurView['props'];

/**
 * A view that gets blurry on iOS but stays solid on Android
 */
const SystemView = forwardRef<View, Props>(
  ({ children, style, variant = 'background', shadow = true, ...rest }, ref) => {
    const isDark = useColorScheme() === 'dark';
    const primary = useThemeColor('primary');
    const background = useThemeColor('background');

    if (Platform.OS === 'ios') {
      return (
        <BlurView
          ref={ref as any}
          intensity={variant === 'primary' ? 65 : 85}
          tint={variant === 'primary' ? 'systemChromeMaterialDark' : isDark ? 'dark' : 'extraLight'}
          style={[
            {
              backgroundColor: variant === 'primary' ? `${primary}88` : `${background}66`,
            },
            style,
          ]}
          {...rest}
        >
          {children}
        </BlurView>
      );
    }
    return (
      <View
        ref={ref}
        style={[
          {
            backgroundColor: variant === 'primary' ? primary : background,
            boxShadow: shadow ? '0px 0px 10px rgba(0, 0, 0, 0.2)' : undefined,
          },
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }
);

// Add display name for better debugging
SystemView.displayName = 'SystemView';

export default SystemView;
