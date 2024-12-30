import { KeyboardAvoidingView, Platform, SafeAreaView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import { ThemeProvider } from '@react-navigation/native';

import { DarkTheme, LightTheme } from '@/constants/Themes';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const primary = useThemeColor('primary');
  const background = useThemeColor('background');

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Stack
          screenOptions={{
            headerTitleStyle: { color: '#fff' },
            headerTintColor: '#fff',
            headerStyle: { backgroundColor: primary },
            headerLargeTitle: true,
            headerLargeTitleStyle: { color: '#fff', fontFamily: 'Modekan' },
          }}
        />
      </KeyboardAvoidingView>
    </ThemeProvider>
  );
}
