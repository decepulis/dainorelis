import { useEffect, useLayoutEffect, useState } from 'react';
import { Appearance, LayoutChangeEvent, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { setAudioModeAsync } from 'expo-audio';
import { Stack } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';

import { initI18n } from '@/lib/constants/i18n';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import { DidImagesLoadProvider, useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import useStorage, { StorageProvider } from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

type AppProps = {
  onLayout: (e: LayoutChangeEvent) => void;
};
function App({ onLayout }: AppProps) {
  const background = useThemeColor('background');

  return (
    <>
      <View style={{ flex: 1, backgroundColor: background }} onLayout={onLayout}>
        <Stack
          screenOptions={{
            headerTransparent: true,
            title: '',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="nustatymai" options={{ presentation: 'modal' }} />
          <Stack.Screen name="dainos/[id]" />
          <Stack.Screen name="dainos/[id]/vertimas" options={{ presentation: 'modal' }} />
          <Stack.Screen name="dainos/[id]/aprasymas" options={{ presentation: 'modal' }} />
        </Stack>
      </View>
    </>
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

function AppWithLoading() {
  const [asyncWorkIsDone, setAsyncWorkIsDone] = useState(false);
  const [didAppLayout, setDidAppLayout] = useState(false);
  const { didLogoLoad, didWordmarkLoad, didBackgroundLoad } = useDidImagesLoad();

  // do async work that needs to be done before the splash screen here
  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([
          initI18n(),
          setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: true,
            interruptionMode: 'doNotMix',
          }),
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAsyncWorkIsDone(true);
      }
    }

    prepare();
  }, []);

  // hide the splash screen when we're good to go
  useEffect(() => {
    if (asyncWorkIsDone && didAppLayout && didLogoLoad && didBackgroundLoad && didWordmarkLoad) {
      SplashScreen.hide();
    }
  }, [asyncWorkIsDone, didAppLayout, didLogoLoad, didBackgroundLoad, didWordmarkLoad]);

  if (asyncWorkIsDone) {
    return <App onLayout={() => setDidAppLayout(true)} />;
  }
  return null;
}

// Sync the user's stored theme preference ('auto' | 'light' | 'dark') with
// react-native's Appearance API, then forward the resolved colorScheme to
// react-navigation's ThemeProvider. Pattern from
// https://reactnavigation.org/docs/themes/#using-the-current-theme-in-your-own-components
function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { value: storedTheme } = useStorage('theme');
  const colorScheme = useColorScheme();

  useLayoutEffect(() => {
    Appearance.setColorScheme(storedTheme === 'auto' ? 'unspecified' : storedTheme);
  }, [storedTheme]);

  return <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>{children}</ThemeProvider>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
        <StorageProvider>
          <DidImagesLoadProvider>
            <ThemedRoot>
              <AppWithLoading />
            </ThemedRoot>
          </DidImagesLoadProvider>
        </StorageProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
