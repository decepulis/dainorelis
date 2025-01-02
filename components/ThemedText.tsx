import React, { forwardRef } from 'react';
import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

const ThemedText = forwardRef<Text, TextProps>(({ style, ...rest }, ref) => {
  const color = useThemeColor('text');

  // todo try merriweather, lato
  return <Text ref={ref} style={[{ color, fontFamily: 'KlavikaRegular' }, style]} {...rest} />;
});

ThemedText.displayName = 'ThemedText';

export default ThemedText;
