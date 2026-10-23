import { useColorScheme as useRNColorScheme } from 'react-native';

import useHasHydrated from './useHasHydrated';
import useStorage from './useStorage';

/**
 * Light while hydrating, like the statically rendered HTML; then the theme setting, which react-native-web's
 * Appearance can't take, or the browser's color scheme.
 */
export function useColorScheme(): 'light' | 'dark' {
  const hasHydrated = useHasHydrated();
  const colorScheme = useRNColorScheme();
  const { value: theme } = useStorage('theme');

  if (!hasHydrated) return 'light';
  return theme === 'auto' ? (colorScheme === 'dark' ? 'dark' : 'light') : theme;
}
