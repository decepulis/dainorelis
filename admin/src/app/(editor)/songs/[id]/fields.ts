import type { ChildTable } from '@/lib/supabase/types';

export type FieldKind = 'text' | 'textarea' | 'url' | 'checkbox';

export type FieldSpec = {
  column: string;
  label: string;
  kind: FieldKind;
  /** Shown under the input; use for anything non-obvious about the field. */
  hint?: string;
  /** Renders full width rather than in the two-column grid. */
  wide?: boolean;
  /** For a URL field: offers an upload to media.dainorelis.app, taking files of this `accept` type. */
  upload?: string;
};

export type SectionSpec = {
  table: ChildTable;
  title: string;
  addLabel: string;
  fields: FieldSpec[];
};

const VARIANT_FIELDS: FieldSpec[] = [
  {
    column: 'variant_name',
    label: 'Variant name (LT)',
    kind: 'text',
    hint: 'Leave blank to let the export name it automatically.',
  },
  { column: 'en_variant_name', label: 'Variant name (EN)', kind: 'text', hint: 'Defaults to the LT name.' },
];

export const SECTIONS: SectionSpec[] = [
  {
    table: 'lyrics',
    title: 'Lyrics & chords',
    addLabel: 'Add lyrics variant',
    fields: [
      ...VARIANT_FIELDS,
      {
        column: 'lyrics_and_chords',
        label: 'Lyrics & chords',
        kind: 'textarea',
        wide: true,
        hint: 'Markdown. Chords go inline as [ ](C) — the export widens the brackets to fit the chord.',
      },
      { column: 'show_chords', label: 'Show chords', kind: 'checkbox' },
      { column: 'notes', label: 'Notes', kind: 'textarea', wide: true },
    ],
  },
  {
    table: 'translations',
    title: 'Translations',
    addLabel: 'Add translation',
    fields: [
      {
        column: 'title',
        label: 'English title',
        kind: 'text',
        hint: 'Title case: capitalize every word except articles, conjunctions and short prepositions.',
      },
      ...VARIANT_FIELDS,
      { column: 'lyrics', label: 'Translated lyrics', kind: 'textarea', wide: true },
      { column: 'ai_generated', label: 'AI generated', kind: 'checkbox' },
      { column: 'notes', label: 'Notes', kind: 'textarea', wide: true },
    ],
  },
  {
    table: 'audio',
    title: 'Audio',
    addLabel: 'Add audio',
    fields: [
      ...VARIANT_FIELDS,
      {
        column: 'url',
        label: 'URL',
        kind: 'url',
        wide: true,
        upload: 'audio/*',
        hint: 'Upload a recording, or link out to one (Spotify, YouTube). The app plays only audio files for now.',
      },
      { column: 'album', label: 'Album', kind: 'text' },
      { column: 'artist', label: 'Artist', kind: 'text' },
    ],
  },
  {
    table: 'pdfs',
    title: 'Sheet music',
    addLabel: 'Add PDF',
    fields: [
      ...VARIANT_FIELDS,
      {
        column: 'url',
        label: 'PDF URL',
        kind: 'url',
        wide: true,
        upload: 'application/pdf',
        hint: 'Upload a PDF, or link to one.',
      },
    ],
  },
  {
    table: 'videos',
    title: 'Videos',
    addLabel: 'Add video',
    fields: [
      ...VARIANT_FIELDS,
      {
        column: 'youtube_link',
        label: 'Video URL',
        kind: 'url',
        wide: true,
        upload: 'video/*',
        hint: 'Upload a video, or link out to one (YouTube). Stored, but currently excluded from the app bundle by fieldFlags in update-songs.ts.',
      },
    ],
  },
];
