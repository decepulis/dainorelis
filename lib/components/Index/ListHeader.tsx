import { StyleSheet } from 'react-native';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

import ThemedText from '../ThemedText';
import { padding } from './constants';

export default function ListHeader({ title }: { title: string }) {
  const separator = useThemeColor('separator');
  return (
    <ThemedText
      bold
      style={[
        styles.sectionHeader,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: separator,
        },
      ]}
    >
      {title}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginLeft: padding,
    paddingRight: padding,
    paddingVertical: 18,
    fontSize: 18,
  },
});
