import { Stack } from 'expo-router';

import { ThemeProvider } from '@react-navigation/native';

import { DarkTheme, LightTheme } from '@/constants/Themes';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const primary = useThemeColor('primary');

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : LightTheme}>
      <Stack
        screenOptions={{
          headerTitleStyle: { color: '#fff' },
          headerTintColor: '#fff',
          headerStyle: { backgroundColor: primary },
        }}
      />
    </ThemeProvider>
  );
}
