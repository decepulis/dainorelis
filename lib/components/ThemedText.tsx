import { Text, type TextInstance, type TextProps } from 'react-native';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';
import useAccessibilityInfo from '../hooks/useAccessibilityInfo';

type Props = {
  bold?: boolean;
  italic?: boolean;
  ref?: React.Ref<TextInstance>;
} & TextProps;
export default function ThemedText({ bold, italic, style, ...rest }: Props) {
  const color = useThemeColor('text');

  const { isBoldTextEnabled } = useAccessibilityInfo();

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

  return <Text style={[{ color }, style, font]} {...rest} />;
}
