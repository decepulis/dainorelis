// web only: the theme colors as CSS custom properties, so statically rendered pages paint in the reader's mode
// before any JavaScript runs. +html.tsx puts `themeStyle` and `themeScript` in every page's <head>, useTheme.web.ts
// hands out `var(--color-…)` strings, and app/_layout.tsx keeps <html data-theme> in step with the setting
import {
  DarkHighContrastTheme,
  DarkTheme,
  LightHighContrastTheme,
  LightTheme,
  type Theme,
} from '@/lib/constants/themes';

type ColorName = keyof Theme['colors'];

const cssName = (name: string) => `--color-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;

const declarations = (colors: Partial<Theme['colors']>) =>
  Object.entries(colors)
    .map(([name, value]) => `${cssName(name)}:${value};`)
    .join('');

const changed = (theme: Theme, base: Theme) =>
  Object.fromEntries(
    Object.entries(theme.colors).filter(([name, value]) => base.colors[name as ColorName] !== value)
  ) as Partial<Theme['colors']>;

export const cssVariableColors = Object.fromEntries(
  Object.keys(LightTheme.colors).map((name) => [name, `var(${cssName(name)})`])
) as Theme['colors'];

/**
 * Light by default, dark for data-theme="dark" (or, if the script didn't run, a dark browser), and the high contrast
 * tints when the browser asks for more contrast
 */
export const themeStyle = [
  `:root{color-scheme:light;${declarations(LightTheme.colors)}}`,
  `@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;${declarations(DarkTheme.colors)}}}`,
  `:root[data-theme="dark"]{color-scheme:dark;${declarations(DarkTheme.colors)}}`,
  `@media (prefers-contrast:more){`,
  `:root[data-theme="light"]{${declarations(changed(LightHighContrastTheme, LightTheme))}}`,
  `:root[data-theme="dark"]{${declarations(changed(DarkHighContrastTheme, DarkTheme))}}}`,
  `html,body{background-color:var(--color-background);color:var(--color-text);}`,
  // no grey flash on tap: every control shows its own pressed state
  `html{-webkit-tap-highlight-color:transparent;}`,
].join('');

/** react-native-mmkv's web build keeps each key in localStorage as `<instance id>\<key>`, JSON encoded */
const themeStorageKey = 'mmkv.default\\theme';

/** The stored theme setting resolved to 'light' or 'dark' (an unset or 'auto' setting follows the browser) */
export function resolveStoredColorScheme(): 'light' | 'dark' {
  let theme: unknown;
  try {
    theme = JSON.parse(localStorage.getItem(themeStorageKey) ?? '');
  } catch {}
  if (theme === 'light' || theme === 'dark') return theme;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Blocking, in <head>: sets data-theme before the first paint. Same logic as resolveStoredColorScheme */
export const themeScript = `(function(){var t;try{t=JSON.parse(localStorage.getItem(${JSON.stringify(themeStorageKey)}))}catch(e){}if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)})()`;
