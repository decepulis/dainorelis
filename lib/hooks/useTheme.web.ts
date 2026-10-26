import { LightTheme, type Theme } from '@/lib/constants/themes';
import { cssVariableColors } from '@/lib/constants/webTheme';
import { useColorScheme } from '@/lib/hooks/useColorScheme';

/**
 * CSS variables rather than colors, so the statically rendered HTML is right in either mode before hydration;
 * <html data-theme> and the browser's contrast setting pick the values (lib/constants/webTheme.ts)
 */
export default function useTheme(): Theme {
  const isDark = useColorScheme() === 'dark';
  return { ...LightTheme, dark: isDark, colors: cssVariableColors };
}
