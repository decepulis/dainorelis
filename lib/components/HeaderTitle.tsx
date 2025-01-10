import { View } from 'react-native';

import { fonts } from '../constants/themes';
import ThemedText from './ThemedText';

type HeaderTitleProps = {
  children: string;
  tintColor?: string;
};
export default function HeaderTitle({ children, tintColor }: HeaderTitleProps): React.ReactNode {
  // if the header title has parentheses, break it up!
  const parts = children
    .split(/(\(.*\))/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <View>
      {parts.map((part, index) => (
        <ThemedText
          key={index}
          numberOfLines={parts.length === 1 && index === 0 ? 2 : 1}
          style={{
            color: tintColor,
            fontFamily: index === 0 ? fonts.bold.fontFamily : fonts.regular.fontFamily,
            fontWeight: index === 0 ? fonts.bold.fontWeight : fonts.regular.fontWeight,
            fontSize: parts.length === 1 ? 18 : index === 0 ? 17 : 15,
            lineHeight: parts.length === 1 ? 18 * 1.25 : index === 0 ? 17 * 1.25 : 15 * 1.25,
            textAlign: 'center',
            // nudge it down just a bit if it's the only part
            position: 'relative',
            top: parts.length === 1 ? 1 : 0,
          }}
        >
          {part}
        </ThemedText>
      ))}
    </View>
  );
}
