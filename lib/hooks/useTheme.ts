import type { Theme } from '@/lib/constants/themes';
/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */
import { DarkHighContrastTheme, DarkTheme, LightHighContrastTheme, LightTheme } from '@/lib/constants/themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';

import useAccessibilityInfo from './useAccessibilityInfo';

export default function useTheme() {
  const isDark = useColorScheme() === 'dark';
  const { isHighContrastEnabled } = useAccessibilityInfo();

  let theme: Theme;
  if (isHighContrastEnabled) {
    theme = isDark ? DarkHighContrastTheme : LightHighContrastTheme;
  } else {
    theme = isDark ? DarkTheme : LightTheme;
  }
  return theme;
}
