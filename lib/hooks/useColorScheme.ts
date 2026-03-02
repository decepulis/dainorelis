import { Appearance, useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  const colorScheme = useRNColorScheme();
  if (colorScheme === 'dark') return 'dark';
  if (colorScheme === 'light') return 'light';
  // RN 0.83 can return null or 'unspecified' after Appearance.setColorScheme() —
  // fall back to a direct read which is always current
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}
