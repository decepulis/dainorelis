import { useEffect, useState } from 'react';
import { Appearance, LayoutChangeEvent, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { setAudioModeAsync } from 'expo-audio';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { ThemeProvider } from '@react-navigation/native';

import { initI18n } from '@/lib/constants/i18n';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import { DidImagesLoadProvider, useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import { StorageProvider, storage } from '@/lib/hooks/useStorage';
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

// Set initial color scheme from stored preference before React renders.
// This avoids calling Appearance.setColorScheme(null) in an effect, which on
// RN 0.83 can emit null/'unspecified' and break useColorScheme().
const _storedTheme = (() => {
  try {
    const v = storage.getString('theme');
    return v ? JSON.parse(v) : 'auto';
  } catch {
    return 'auto';
  }
})();
if (_storedTheme === 'light' || _storedTheme === 'dark') {
  Appearance.setColorScheme(_storedTheme);
}

// Keep native appearance in sync with runtime theme preference changes
storage.addOnValueChangedListener((key) => {
  if (key === 'theme') {
    try {
      const v = storage.getString('theme');
      const theme = v ? JSON.parse(v) : 'auto';
      Appearance.setColorScheme(theme === 'auto' ? null : theme);
    } catch {}
  }
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
