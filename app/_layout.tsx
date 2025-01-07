import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform } from 'react-native';

import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider } from '@react-navigation/native';

import '@/lib/constants/i18n.ts';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import { StorageProvider } from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const primary = useThemeColor('primary');
  const background = useThemeColor('background');

  const { t } = useTranslation();

  useLayoutEffect(() => {
    // Keep android navigation bar color in sync with the app
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(background);
      NavigationBar.setButtonStyleAsync('light');
    }
  }, [background]);

  return (
    <>
      <StatusBar style="light" translucent={true} />
      <StorageProvider>
        {/* TODO ios flash of dark theme */}
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
          {/* TODO: this is weird on ipad */}
          {/* TODO: this causes a rave on android (Pixel 9 Fold) */}
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
              <Stack.Screen name="index" options={{ title: t('songs') }} />
              <Stack.Screen name="apie-mus" options={{ title: t('aboutUs'), presentation: 'modal' }} />
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
    </>
  );
}
