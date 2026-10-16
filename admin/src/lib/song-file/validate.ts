import { z } from 'zod';

import { isAlreadyEnglish } from './already-english';
import { BUNDLED_FIELDS, LINK_KEYS } from './bundled-fields';
import type { SongFields, SongFile } from './types';

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
    Name: z.string(),
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

export function findIssues(songs: SongFile): Issue[] {
  const issues: Issue[] = [];

  for (const song of songs) {
    const songName = song.fields.Name;
    const add = (severity: Issue['severity'], message: string) =>
      issues.push({ songId: song.id, songName, severity, message });

    // Validate what `update-songs` validates: the bundled fields, less the
    // rows it skips for a blank link. Anything else can't block the app.
    const bundled: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(song.fields)) {
      if (BUNDLED_FIELDS.has(field as keyof SongFields)) bundled[field] = value;
    }

    for (const [field, linkKey] of Object.entries(LINK_KEYS)) {
      const records = bundled[field] as Record<string, Record<string, unknown>> | undefined;
      if (!records) continue;

      bundled[field] = Object.fromEntries(
        Object.entries(records).filter(([recordId, record]) => {
          if (typeof record[linkKey] !== 'string' || record[linkKey].trim() !== '') return true;
          add('warning', `${field} ${recordId} has no ${linkKey}, so the app leaves it out.`);
          return false;
        })
      );
    }

    const parsed = SongSchema.safeParse({ id: song.id, fields: bundled });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        add('error', `${issue.path.join(' → ') || 'song'}: ${issue.message}`);
      }
    }

    // Fields the app doesn't bundle yet are still worth keeping valid.
    const unbundled = SongSchema.safeParse(song);
    if (!unbundled.success) {
      for (const issue of unbundled.error.issues) {
        const field = issue.path[1];
        if (typeof field === 'string' && !BUNDLED_FIELDS.has(field as keyof SongFields)) {
          add('warning', `${issue.path.join(' → ')}: ${issue.message} (not bundled by the app, so not blocking)`);
        }
      }
    }

    if (!songName.trim()) add('warning', 'The title is blank.');

    if (Object.keys(song.fields.Lyrics).length === 0) {
      add('error', 'No lyrics variant — the app requires at least one.');
    }

    if (Object.keys(song.fields.Translations).length === 0 && !isAlreadyEnglish(songName)) {
      add('warning', 'No translation.');
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
