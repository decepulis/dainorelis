import type { Theme } from '@/lib/constants/themes';

import useTheme from './useTheme';

export function useThemeColor(colorName: keyof Theme['colors']) {
  const theme = useTheme();
  return theme.colors[colorName];
}
