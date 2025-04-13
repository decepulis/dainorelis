import React, { forwardRef } from 'react';
import { Text, TextProps, TextStyle } from 'react-native';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';
import useA11yBoldText from '../hooks/useA11yBoldText';

type Props = {
  bold?: boolean;
  italic?: boolean;
} & TextProps;
const ThemedText = forwardRef<Text, Props>(({ bold, italic, style, ...rest }, ref) => {
  const color = useThemeColor('text');

  const isBoldTextEnabled = useA11yBoldText();

  const regularFont = isBoldTextEnabled ? fonts.medium : fonts.regular;
  const regularItalicFont = isBoldTextEnabled ? fonts.mediumItalic : fonts.regularItalic;
  const boldFont = isBoldTextEnabled ? fonts.heavy : fonts.bold;
  const boldItalicFont = isBoldTextEnabled ? fonts.heavyItalic : fonts.boldItalic;

  let font = regularFont;
  if (bold && italic) {
    font = boldItalicFont;
  } else if (bold) {
    font = boldFont;
  } else if (italic) {
    font = regularItalicFont;
  }

  return <Text ref={ref} style={[{ color }, style, font]} {...rest} />;
});

ThemedText.displayName = 'ThemedText';

export default ThemedText;
