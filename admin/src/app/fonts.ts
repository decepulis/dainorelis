import localFont from 'next/font/local';

/**
 * The one place the admin's fonts are defined. Body text uses the system stack
 * (`--font-sans` in globals.css); this is only the wordmark face, the same
 * Modekan the app embeds for its header logo (assets/fonts/Modekan.ttf).
 * Swap it here and every `font-brand` follows.
 */
export const brandFont = localFont({
  src: './fonts/Modekan.ttf',
  variable: '--brand-typeface',
  display: 'swap',
});
