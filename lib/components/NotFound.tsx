import { StyleSheet, View } from 'react-native';

import { Stack } from 'expo-router';

import padding from '@/lib/constants/padding';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { HeaderBackground, HeaderLeft, ModalToolbar, isLiquidGlassStyleHeader } from './Header';
import ThemedText from './ThemedText';

type Props = {
  message: string;
  /** a modal route: close (×) instead of back (‹) */
  modal?: boolean;
};

/**
 * What a song route renders when its song (or the translation/description it shows) doesn't
 * exist: a stale deep link, a song deleted in the admin, or a mistyped id.
 */
export default function NotFound({ message, modal }: Props) {
  const background = useThemeColor('background');
  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <Stack.Screen
        options={{
          headerBackground: () => <HeaderBackground opaque />,
          headerLeft: !isLiquidGlassStyleHeader() ? (props) => <HeaderLeft {...props} modal={modal} /> : undefined,
        }}
      />
      <ModalToolbar back={!modal} />
      <ThemedText style={styles.message}>{message}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: padding * 2,
  },
  message: {
    fontSize: 17,
    textAlign: 'center',
  },
});
