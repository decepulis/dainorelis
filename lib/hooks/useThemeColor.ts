import type { Theme } from '@/lib/constants/Themes';
/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import { DarkTheme, LightTheme } from '@/lib/constants/Themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';

export function useThemeColor(colorName: keyof Theme['colors']) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? DarkTheme : LightTheme;
  return theme.colors[colorName];
}
