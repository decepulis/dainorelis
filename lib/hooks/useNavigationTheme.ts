import { DarkTheme, LightTheme } from '@/lib/constants/themes';
import { useColorScheme } from '@/lib/hooks/useColorScheme';

/** react-navigation's theme */
export default function useNavigationTheme() {
  return useColorScheme() === 'dark' ? DarkTheme : LightTheme;
}
