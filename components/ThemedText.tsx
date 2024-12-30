import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export function ThemedText({ style, ...rest }: TextProps) {
  const color = useThemeColor('text');

  return <Text style={[{ color, fontFamily: 'KlavikaRegular' }, style]} {...rest} />;
}
