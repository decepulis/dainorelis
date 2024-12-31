import { KeyboardAvoidingView, Platform, Text } from 'react-native';

import { ImageBackground } from 'expo-image';
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
        >
          <Stack.Screen name="index" options={{ title: 'Dainorėlis' }} />
          <Stack.Screen
            name="dainos/[id]"
            options={{
              // this title is dynamically set within the component
              title: '',
            }}
          />
        </Stack>
      </KeyboardAvoidingView>
    </ThemeProvider>
  );
}
