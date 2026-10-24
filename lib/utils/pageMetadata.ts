import type { Metadata } from 'expo-router/server';

import { Song } from '../schemas/songs';
import { splitTitle } from './useTitle';

// web: the statically rendered pages' <title> and description, for search engines and link previews

/** a page's title and description, with every page's icons and preview image (public/, from
 * scripts/generate-brand-assets.ts; link previews need an absolute URL) */
const page = (title: string, description: string): Metadata => ({
  title,
  description,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title,
    description,
    siteName: 'Dainorėlis',
    locale: 'lt_LT',
    type: 'website',
    images: { url: 'https://dainorelis.app/og.jpg', width: 1200, height: 630, alt: 'Dainorėlis' },
  },
  twitter: { card: 'summary_large_image' },
});

const siteDescription = 'Lietuvių liaudies, stovyklų ir vaikų dainos su akordais, natomis ir įrašais.';

export const siteMetadata = page('Dainorėlis', siteDescription);

export const songPageTitle = (song: Song) => `${splitTitle(song.fields.Name)[0]} – Dainorėlis`;

/** the song's title, and its first lines without chords or markdown */
export function songMetadata(song: Song): Metadata {
  const lyrics = Object.values(song.fields.Lyrics)[0]?.['Lyrics & Chords'] ?? '';
  const text = lyrics
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [text](Chord)
    .replace(/[*_#>`]|^\s*- /gm, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join(' / ');
  return page(
    songPageTitle(song),
    text ? (text.length > 155 ? `${text.slice(0, 154).trimEnd()}…` : text) : siteDescription
  );
}
