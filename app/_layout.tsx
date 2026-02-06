import { useEffect, useState } from 'react';
import { Appearance, LayoutChangeEvent, View, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { setAudioModeAsync } from 'expo-audio';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider } from '@react-navigation/native';

import { initI18n } from '@/lib/constants/i18n';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
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
  const [isColorSchemeSet, setIsColorSchemeSet] = useState(false);
  const [didAppLayout, setDidAppLayout] = useState(false);
  const { didLogoLoad, didWordmarkLoad, didBackgroundLoad } = useDidImagesLoad();
  const { value: colorSchemePreference } = useStorage('theme');

  // keep color scheme in sync with storage
  useEffect(() => {
    Appearance.setColorScheme(colorSchemePreference === 'auto' ? null : colorSchemePreference);
    // due to batching, I might be setting this too early. tbd.
    setIsColorSchemeSet(true);
  }, [colorSchemePreference]);

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
    if (asyncWorkIsDone && isColorSchemeSet && didAppLayout && didLogoLoad && didBackgroundLoad && didWordmarkLoad) {
      SplashScreen.hide();
    }
  }, [asyncWorkIsDone, isColorSchemeSet, didAppLayout, didLogoLoad, didBackgroundLoad, didWordmarkLoad]);

  if (asyncWorkIsDone && isColorSchemeSet) {
    return <App onLayout={() => setDidAppLayout(true)} />;
  }
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView>
      <KeyboardProvider>
        <StorageProvider>
          <DidImagesLoadProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
              <AppWithLoading />
            </ThemeProvider>
          </DidImagesLoadProvider>
        </StorageProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
