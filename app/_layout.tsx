import { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Appearance, LayoutChangeEvent, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { setAudioModeAsync } from 'expo-audio';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';

import AppIntentsHandler from '@/lib/components/AppIntentsHandler';
import { shareSheetOptions } from '@/lib/components/ShareSheet';
import { initI18n } from '@/lib/constants/i18n';
import { DidImagesLoadProvider, useDidImagesLoad } from '@/lib/hooks/useDidImagesLoad';
import useNavigationTheme from '@/lib/hooks/useNavigationTheme';
import useStorage, { StorageProvider } from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import useWebFonts from '@/lib/hooks/useWebFonts';
import { siteMetadata } from '@/lib/utils/pageMetadata';

type AppProps = {
  onLayout: (e: LayoutChangeEvent) => void;
};
function App({ onLayout }: AppProps) {
  const background = useThemeColor('background');

  return (
    <>
      {process.env.EXPO_OS === 'web' ? (
        // the title as the app navigates (song pages set their own); generateMetadata sets the static HTML's
        <Head>
          <title>{siteMetadata.title}</title>
        </Head>
      ) : null}
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
          <Stack.Screen name="dainos/[id]/bendrinti" options={shareSheetOptions} />
          <Stack.Screen name="p" options={{ presentation: 'modal' }} />
          <Stack.Screen name="grojarasciai/[id]/bendrinti" options={shareSheetOptions} />
        </Stack>
        <AppIntentsHandler />
      </View>
    </>
  );
}

// Keep index at the bottom of the stack even when a deep link opens another screen first
// (cold start on dainorelis://dainos/<id>), so back has somewhere to go and Index mounts.
export const unstable_settings = {
  anchor: 'index',
};

// Never hold the splash longer than this waiting on Index's images: if Index's images don't load (it
// isn't the focused screen, or a decode fails), launch would otherwise hang on the splash.
const splashImageTimeoutMs = 1500;

// Wrapping App is the Root Layout, which manages resource loading and the splash screen
// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// before the first render, so nothing renders untranslated
initI18n();

// Set the animation options. This is optional.
SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

function AppWithLoading() {
  const [didAppLayout, setDidAppLayout] = useState(false);
  const [didImagesTimeOut, setDidImagesTimeOut] = useState(false);
  const { didLogoLoad, didBackgroundLoad } = useDidImagesLoad();

  // only has to be in place before the first play(), not before the first frame
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(console.warn);
  }, []);

  const isAppReady = didAppLayout;
  const didImagesLoad = didLogoLoad && didBackgroundLoad;

  // stop waiting for the images a little while after the app is otherwise ready
  useEffect(() => {
    if (!isAppReady) return;
    const timeout = setTimeout(() => setDidImagesTimeOut(true), splashImageTimeoutMs);
    return () => clearTimeout(timeout);
  }, [isAppReady]);

  // hide the splash screen when we're good to go; every flag only ever flips to true, so this runs once
  const shouldHideSplash = isAppReady && (didImagesLoad || didImagesTimeOut);
  useEffect(() => {
    if (shouldHideSplash) {
      SplashScreen.hide();
    }
  }, [shouldHideSplash]);

  return <App onLayout={() => setDidAppLayout(true)} />;
}

// Sync the user's stored theme preference ('auto' | 'light' | 'dark') with
// react-native's Appearance API, then forward the resolved colorScheme to
// react-navigation's ThemeProvider. Pattern from
// https://reactnavigation.org/docs/themes/#using-the-current-theme-in-your-own-components
function ThemedRoot({ children }: { children: React.ReactNode }) {
  const { value: storedTheme } = useStorage('theme');
  const { value: language } = useStorage('language');
  const { i18n } = useTranslation();
  const theme = useNavigationTheme();

  useLayoutEffect(() => {
    // web has no Appearance.setColorScheme; useColorScheme.web.ts and useNavigationTheme.web.ts apply the setting
    if (process.env.EXPO_OS === 'web') return;
    Appearance.setColorScheme(storedTheme === 'auto' ? 'unspecified' : storedTheme);
  }, [storedTheme]);

  // web reads storage only after hydration (see useStorage), so the stored language arrives here
  useEffect(() => {
    if (process.env.EXPO_OS !== 'web') return;
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language, i18n]);

  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}

export default function RootLayout() {
  useWebFonts();
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
