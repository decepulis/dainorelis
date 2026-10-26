/**
 * `color` at the opacity of a two-digit hex alpha (`'88'`). Native colors are hex, so it appends the alpha; web
 * colors are CSS variables (lib/constants/webTheme.ts), so it mixes them with transparent. The mix sits in the
 * fallback of an undefined variable because react-native-web and expo-linear-gradient pass on only colors that
 * start with `var(`
 */
export default function withAlpha(color: string, alpha: string) {
  if (process.env.EXPO_OS !== 'web' || !color.startsWith('var(')) return `${color}${alpha}`;
  const percent = Math.round((parseInt(alpha, 16) / 255) * 1000) / 10;
  return `var(--with-alpha, color-mix(in srgb, ${color} ${percent}%, transparent))`;
}
