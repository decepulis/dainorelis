import { Text, type TextInstance, type TextProps } from 'react-native';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { fonts } from '../constants/themes';
import useAccessibilityInfo from '../hooks/useAccessibilityInfo';

type Props = {
  bold?: boolean;
  italic?: boolean;
  /**
   * a title (song, playlist, section) in Saira Semi Condensed: Medium, or SemiBold with `bold`; `'regular'` (the
   * song list's rows) is Regular. Bold Text takes each up a weight.
   */
  title?: boolean | 'regular';
  ref?: React.Ref<TextInstance>;
} & TextProps;
export default function ThemedText({ bold, italic, title, style, ...rest }: Props) {
  const color = useThemeColor('text');

  const { isBoldTextEnabled } = useAccessibilityInfo();

  const regularFont = isBoldTextEnabled ? fonts.medium : fonts.regular;
  const regularItalicFont = isBoldTextEnabled ? fonts.mediumItalic : fonts.regularItalic;
  const boldFont = isBoldTextEnabled ? fonts.heavy : fonts.bold;
  const boldItalicFont = isBoldTextEnabled ? fonts.heavyItalic : fonts.boldItalic;

  let font = regularFont;
  if (title) {
    // the three bundled weights; Bold Text goes one up, SemiBold being the heaviest
    const weights = [fonts.titleRegular, fonts.titleMedium, fonts.titleSemiBold];
    font = weights[Math.min((title === 'regular' ? 0 : bold ? 2 : 1) + (isBoldTextEnabled ? 1 : 0), 2)];
  } else if (bold && italic) {
    font = boldItalicFont;
  } else if (bold) {
    font = boldFont;
  } else if (italic) {
    font = regularItalicFont;
  }

  return <Text style={[{ color }, style, font]} {...rest} />;
}
