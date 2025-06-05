import { forwardRef } from 'react';
import { Platform, StyleProp, View, ViewStyle } from 'react-native';

import { BlurView } from 'expo-blur';

import { useThemeColor } from '../hooks/useThemeColor';

type Props = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  shadow?: boolean;
} & BlurView['props'];

/**
 * A view that gets blurry on iOS but stays solid on Android
 */
const SystemView = forwardRef<View, Props>(({ children, style, shadow = true, ...rest }, ref) => {
  const primary = useThemeColor('primary');

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        ref={ref as any}
        // no need to listen to reduce transparency on iOS; iOS does this for us
        intensity={55}
        tint={'systemChromeMaterialDark'}
        style={[
          {
            backgroundColor: `${primary}88`,
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
          backgroundColor: primary,
          // TODO header overflow hidden is preventing this from drawing
          boxShadow: shadow ? '0px 0px 10px rgba(64, 64, 64, 0.1)' : undefined,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
});

// Add display name for better debugging
SystemView.displayName = 'SystemView';

export default SystemView;
