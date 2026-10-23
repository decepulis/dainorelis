import type { Metadata } from 'expo-router/server';

import { Song } from '../schemas/songs';
import { splitTitle } from './useTitle';

// web: the statically rendered pages' <title> and description, for search engines and link previews

export const siteMetadata: Metadata = {
  title: 'Dainorėlis',
  description: 'Lietuvių liaudies, stovyklų ir vaikų dainos su akordais, natomis ir įrašais.',
};

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
  return {
    title: songPageTitle(song),
    description: text ? (text.length > 155 ? `${text.slice(0, 154).trimEnd()}…` : text) : siteMetadata.description,
  };
}
