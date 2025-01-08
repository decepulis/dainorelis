import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, LayoutChangeEvent, Platform } from 'react-native';

import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider } from '@react-navigation/native';

import { initI18n } from '@/lib/constants/i18n';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import { StorageProvider } from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

type AppProps = {
  onLayout?: (e: LayoutChangeEvent) => void;
};
function App({ onLayout }: AppProps) {
  const colorScheme = useColorScheme();
  const background = useThemeColor('background');
  const primary = useThemeColor('primary');
  const { t } = useTranslation();

  // Keep android navigation bar color in sync with the app
  useLayoutEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(background);
      NavigationBar.setButtonStyleAsync('light');
    }
  }, [background]);

  return (
    <StorageProvider>
      {/* TODO ios flash of dark theme */}
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
        {/* TODO: this is weird on ipad */}
        {/* TODO: this causes a rave on android (Pixel 9 Fold) */}
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: background }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          onLayout={onLayout}
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
  );
}

// Wrapping App is the Root Layout, which manages resource loading and the splash screen
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 1000,
  fade: true,
});
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // do async work that needs to be done before the splash screen here
        await initI18n();
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const dismissSplashScreen = useCallback(() => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hide();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" translucent={true} />
      <App onLayout={dismissSplashScreen} />
    </>
  );
}
