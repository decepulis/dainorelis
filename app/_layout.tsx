import { KeyboardAvoidingView, Platform } from 'react-native';

import { Stack } from 'expo-router';

import { ThemeProvider } from '@react-navigation/native';

import { DarkTheme, LightTheme } from '@/constants/Themes';
import { useColorScheme } from '@/hooks/useColorScheme';
import { StorageProvider } from '@/hooks/useStorage';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const primary = useThemeColor('primary');
  const background = useThemeColor('background');

  return (
    <StorageProvider>
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
            }}
          >
            {/* we unset the title here, though we'll be re-setting it dynamically within the dainos/[id].tsx component */}
            <Stack.Screen
              name="dainos/[id]"
              options={{
                title: '',
              }}
            />
          </Stack>
        </KeyboardAvoidingView>
      </ThemeProvider>
    </StorageProvider>
  );
}
