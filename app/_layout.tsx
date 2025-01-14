import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, LayoutChangeEvent, Platform, Pressable } from 'react-native';

import * as NavigationBar from 'expo-navigation-bar';
import { Link, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import {
  FiraSans_400Regular,
  FiraSans_400Regular_Italic,
  FiraSans_700Bold,
  FiraSans_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/fira-sans';
import { FontAwesome6 } from '@expo/vector-icons';
import { ThemeProvider } from '@react-navigation/native';

import HeaderTitle from '@/lib/components/HeaderTitle';
import { initI18n } from '@/lib/constants/i18n';
import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import { StorageProvider } from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

function HomeButton() {
  return (
    <Link href="/">
      <Pressable hitSlop={24} style={{ paddingHorizontal: 20 }}>
        <FontAwesome6 name="chevron-left" size={18} color="#fff" />
      </Pressable>
    </Link>
  );
}

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

  // the web is weird with back buttons. Let's make it consistent
  const showHomeButton = Platform.OS === 'web';

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
              headerTintColor: '#fff',
              headerStyle: { backgroundColor: primary },
              headerBackButtonDisplayMode: 'minimal',
              headerTitle: HeaderTitle,
              headerLeft: showHomeButton ? HomeButton : undefined, // by default, all pages go home
            }}
          >
            <Stack.Screen name="index" options={{ title: '', headerLeft: undefined }} />
            <Stack.Screen name="apie" options={{ title: '', presentation: 'modal' }} />
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
