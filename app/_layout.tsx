import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { KeyboardAvoidingView, LayoutChangeEvent, Platform } from 'react-native';

import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

// TODO should I load more to support bold fonts in iOS?
import {
  FiraSans_400Regular,
  FiraSans_400Regular_Italic,
  FiraSans_700Bold,
  FiraSans_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/fira-sans';
import { ThemeProvider } from '@react-navigation/native';

import HomeButton from '@/lib/components/HomeButton';
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

  // Keep android navigation bar color in sync with the app
  useLayoutEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(primary);
      NavigationBar.setButtonStyleAsync('light');
    }
  }, [primary]);

  // the web is weird with back buttons. Let's make it consistent
  const showHomeButton = Platform.OS === 'web';

  return (
    <StorageProvider>
      {/* TODO sentry? */}
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
              headerTintColor: '#fff',
              headerStyle: { backgroundColor: primary },
              headerBackButtonDisplayMode: 'minimal',
              // TODO custom back button image
              headerLeft: showHomeButton ? HomeButton : undefined, // by default, all pages go home
            }}
          >
            {/* we're unsetting all the titles here so we can set them dynamically within the pages... or provide a custom header within that page */}
            <Stack.Screen name="index" options={{ title: '', headerLeft: undefined }} />
            <Stack.Screen name="apie" options={{ title: '', presentation: 'modal' }} />
            <Stack.Screen name="dainos/[id]" options={{ title: '' }} />
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
  duration: 400,
  fade: true,
});
export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontIsReady, fontError] = useFonts({
    FiraSans_400Regular,
    FiraSans_400Regular_Italic,
    FiraSans_700Bold,
    FiraSans_700Bold_Italic,
  });

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
    if (appIsReady && (fontIsReady || fontError)) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      SplashScreen.hide();
    }
  }, [appIsReady, fontIsReady, fontError]);

  if (!appIsReady || !(fontIsReady || fontError)) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" translucent={true} />
      <App onLayout={dismissSplashScreen} />
    </>
  );
}
