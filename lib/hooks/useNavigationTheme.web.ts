import { useLayoutEffect } from 'react';

import { resolveStoredColorScheme } from '@/lib/constants/webTheme';
import { useColorScheme } from '@/lib/hooks/useColorScheme';
import useStorage from '@/lib/hooks/useStorage';
import useTheme from '@/lib/hooks/useTheme';

/**
 * react-navigation's theme, CSS variables like every web color (useTheme.web.ts). They follow <html data-theme>,
 * which +html.tsx's script sets before the first paint and this keeps in step with the setting and the browser
 */
export default function useNavigationTheme() {
  const { value: storedTheme } = useStorage('theme');
  const colorScheme = useColorScheme();

  useLayoutEffect(() => {
    // from storage itself: colorScheme is light while hydrating, and has the default setting until the stored
    // values arrive, so it would flash the wrong mode
    document.documentElement.dataset.theme = resolveStoredColorScheme();
  }, [storedTheme, colorScheme]);

  return useTheme();
}
