/**
 * The shape of the JSON bundled into the mobile app.
 *
 * This mirrors `lib/schemas/*` in the app repo. It is duplicated rather than
 * imported because the admin app is a separate Vercel deployment with its own
 * build root — but the app still validates the payload against its own Zod
 * schemas at build time, so a drift between the two fails `update-songs`
 * loudly instead of shipping bad data.
 */

export type LyricsField = {
  'Variant Name': string;
  'EN Variant Name': string;
  'Lyrics & Chords': string;
  'Show Chords'?: boolean;
  Notes?: string;
};

export type TranslationsField = {
  Title: string;
  'Variant Name': string;
  'EN Variant Name': string;
  Lyrics: string;
  'AI Generated'?: boolean;
  Notes?: string;
};

export type AudioField = {
  'Variant Name': string;
  'EN Variant Name': string;
  URL: string;
  Album?: string;
  Artist?: string;
};

export type PDFsField = {
  'Variant Name': string;
  'EN Variant Name': string;
  URL: string;
};

export type VideosField = {
  'Variant Name': string;
  'EN Variant Name': string;
  'YouTube Link': string;
};

export type SongFields = {
  Name: string;
  Lyrics: Record<string, LyricsField>;
  Videos: Record<string, VideosField>;
  Audio: Record<string, AudioField>;
  PDFs: Record<string, PDFsField>;
  Translations: Record<string, TranslationsField>;
  Tags?: string[];
  Sources?: string[];
  'Recommended Key'?: string;
  'Music Author'?: string;
  'Text Author'?: string;
  'LT Description'?: string;
  'EN Description'?: string;
};

export type Song = { id: string; fields: SongFields };
export type SongFile = Song[];
