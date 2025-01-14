import { Platform, View } from 'react-native';

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
    <View style={{ alignSelf: Platform.select({ default: 'center', android: 'flex-start' }) }}>
      {parts.map((part, index) => (
        <ThemedText
          key={index}
          numberOfLines={parts.length === 1 && index === 0 ? 2 : 1}
          style={{
            ...(index === 0 ? fonts.bold : fonts.regular),
            color: tintColor,
            fontSize: parts.length === 1 ? 17 : index === 0 ? 16 : 14,
            lineHeight: parts.length === 1 ? 17 * 1.25 : index === 0 ? 16 * 1.25 : 14 * 1.25,
            textAlign: Platform.select({ default: 'center', android: 'left' }),
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
