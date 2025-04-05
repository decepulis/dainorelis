import React, { forwardRef } from 'react';
import { Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';

const ThemedText = forwardRef<Text, TextProps>(({ style, ...rest }, ref) => {
  const color = useThemeColor('text');

  return <Text ref={ref} style={[{ color, ...fonts.regular }, style]} {...rest} />;
});

ThemedText.displayName = 'ThemedText';

export default ThemedText;
