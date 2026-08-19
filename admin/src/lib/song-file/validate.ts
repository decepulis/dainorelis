import { z } from 'zod';

import type { SongFile } from './types';

/**
 * A mirror of the app's `lib/schemas/*` Zod schemas.
 *
 * The app validates the payload itself at build time, so this is not the
 * enforcement point — it exists so the editor can surface a problem while
 * someone is still in a position to fix it, rather than as a failed release
 * build days later.
 */
const VariantSchema = {
  'Variant Name': z.string(),
  'EN Variant Name': z.string(),
};

const SongSchema = z.object({
  id: z.string(),
  fields: z.object({
    Name: z.string().min(1),
    Lyrics: z.record(
      z.string(),
      z.object({
        ...VariantSchema,
        'Lyrics & Chords': z.string(),
        'Show Chords': z.boolean().optional(),
        Notes: z.string().optional(),
      })
    ),
    Videos: z.record(z.string(), z.object({ ...VariantSchema, 'YouTube Link': z.string().url() })).optional(),
    Audio: z.record(
      z.string(),
      z.object({
        ...VariantSchema,
        URL: z.string().url(),
        Album: z.string().optional(),
        Artist: z.string().optional(),
      })
    ),
    PDFs: z.record(z.string(), z.object({ ...VariantSchema, URL: z.string().url() })),
    Translations: z.record(
      z.string(),
      z.object({
        Title: z.string(),
        ...VariantSchema,
        Lyrics: z.string(),
        'AI Generated': z.boolean().optional(),
        Notes: z.string().optional(),
      })
    ),
    Tags: z.array(z.string()).optional(),
    Sources: z.array(z.string()).optional(),
    'Recommended Key': z.string().optional(),
    'Music Author': z.string().optional(),
    'Text Author': z.string().optional(),
    'LT Description': z.string().optional(),
    'EN Description': z.string().optional(),
  }),
});

export type Issue = {
  songId: string;
  songName: string;
  /** `error` fails the app build; `warning` ships but is probably unintended. */
  severity: 'error' | 'warning';
  message: string;
};

/**
 * Songs whose titles start with these are already in English, so a missing
 * translation is expected rather than an oversight. Mirrors the check that
 * `update-songs.ts` did against Airtable.
 */
const ALREADY_TRANSLATED = ['JAV ', 'Kanados '];

export function findIssues(songs: SongFile): Issue[] {
  const issues: Issue[] = [];

  for (const song of songs) {
    const songName = song.fields.Name;
    const add = (severity: Issue['severity'], message: string) =>
      issues.push({ songId: song.id, songName, severity, message });

    const parsed = SongSchema.safeParse(song);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        add('error', `${issue.path.join(' → ') || 'song'}: ${issue.message}`);
      }
    }

    if (Object.keys(song.fields.Lyrics).length === 0) {
      add('error', 'No lyrics variant — the app requires at least one.');
    }

    if (Object.keys(song.fields.Translations).length === 0) {
      const isAlreadyTranslated = ALREADY_TRANSLATED.some((prefix) => songName.startsWith(prefix));
      if (!isAlreadyTranslated) add('warning', 'No translation.');
    }

    for (const [variantId, lyrics] of Object.entries(song.fields.Lyrics)) {
      if (!lyrics['Lyrics & Chords'].trim()) {
        add('warning', `Lyrics variant ${variantId} is empty.`);
      }
    }
  }

  // Duplicate titles are legal but usually a copy/paste accident, and they make
  // the song indistinguishable in the app's list.
  const byName = new Map<string, string[]>();
  for (const song of songs) {
    byName.set(song.fields.Name, [...(byName.get(song.fields.Name) ?? []), song.id]);
  }
  for (const [name, ids] of byName) {
    if (ids.length > 1) {
      issues.push({
        songId: ids[0],
        songName: name,
        severity: 'warning',
        message: `${ids.length} songs share this title (${ids.join(', ')}).`,
      });
    }
  }

  return issues;
}

export function countRecords(songs: SongFile) {
  const totals = { lyrics: 0, translations: 0, audio: 0, pdfs: 0, videos: 0 };
  for (const song of songs) {
    totals.lyrics += Object.keys(song.fields.Lyrics).length;
    totals.translations += Object.keys(song.fields.Translations).length;
    totals.audio += Object.keys(song.fields.Audio).length;
    totals.pdfs += Object.keys(song.fields.PDFs).length;
    totals.videos += Object.keys(song.fields.Videos).length;
  }
  return totals;
}
