import { StyleProp, View, ViewStyle } from 'react-native';

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
export default function SystemView({ children, style, shadow = true, ...rest }: Props) {
  const chrome = useThemeColor('chrome');

  if (process.env.EXPO_OS === 'ios') {
    return (
      <BlurView
        // no need to listen to reduce transparency on iOS; iOS does this for us
        intensity={55}
        tint={'systemChromeMaterialDark'}
        style={[
          {
            backgroundColor: `${chrome}88`,
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
      style={[
        {
          backgroundColor: chrome,
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
}
