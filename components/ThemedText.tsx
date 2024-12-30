import React, { forwardRef } from 'react';
import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export const ThemedText = forwardRef<Text, TextProps>(({ style, ...rest }, ref) => {
  const color = useThemeColor('text');

  return <Text ref={ref} style={[{ color, fontFamily: 'KlavikaRegular' }, style]} {...rest} />;
});
