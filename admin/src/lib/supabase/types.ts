/**
 * Hand-written mirror of `supabase/migrations/*.sql`.
 *
 * Regenerate with `supabase gen types typescript` once you have the project
 * linked; until then keep this in step with the migrations by hand.
 */

type Timestamps = { created_at: string; updated_at: string };

type SongRowShape = {
  id: string;
  name: string;
  tags: string[] | null;
  sources: string[] | null;
  recommended_key: string | null;
  music_author: string | null;
  text_author: string | null;
  lt_description: string | null;
  en_description: string | null;
  hide: boolean;
} & Timestamps;

type ChildShape = {
  id: string;
  song_id: string;
  position: number;
  variant_name: string | null;
  en_variant_name: string | null;
} & Timestamps;

type LyricsRowShape = ChildShape & {
  lyrics_and_chords: string;
  show_chords: boolean | null;
  notes: string | null;
};

type TranslationsRowShape = ChildShape & {
  title: string | null;
  lyrics: string;
  ai_generated: boolean | null;
  notes: string | null;
};

type AudioRowShape = ChildShape & { url: string; album: string | null; artist: string | null };
type PDFsRowShape = ChildShape & { url: string };
type VideosRowShape = ChildShape & { youtube_link: string };

/** `id`, `position` and the timestamps all have database defaults. */
type Insert<T> = Omit<Partial<T>, 'created_at' | 'updated_at'>;

/**
 * Child tables all hang off `songs` by the same foreign key shape. Declaring it
 * is what lets supabase-js type embedded selects like `songs(…, lyrics(*))`;
 * without it every embedded relation resolves to an error type.
 */
type SongRelationship<TableName extends string> = [
  {
    foreignKeyName: `${TableName}_song_id_fkey`;
    columns: ['song_id'];
    isOneToOne: false;
    referencedRelation: 'songs';
    referencedColumns: ['id'];
  },
];

type Table<T, R> = { Row: T; Insert: Insert<T>; Update: Insert<T>; Relationships: R };

type ChildTableDef<TableName extends string, T> = Table<T, SongRelationship<TableName>>;

export type Database = {
  public: {
    Tables: {
      songs: Table<SongRowShape, []>;
      lyrics: ChildTableDef<'lyrics', LyricsRowShape>;
      translations: ChildTableDef<'translations', TranslationsRowShape>;
      audio: ChildTableDef<'audio', AudioRowShape>;
      pdfs: ChildTableDef<'pdfs', PDFsRowShape>;
      videos: ChildTableDef<'videos', VideosRowShape>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type SongRecord = SongRowShape;
export type LyricsRecord = LyricsRowShape;
export type TranslationsRecord = TranslationsRowShape;
export type AudioRecord = AudioRowShape;
export type PDFsRecord = PDFsRowShape;
export type VideosRecord = VideosRowShape;

/** The child tables, as the editor UI refers to them. */
export const CHILD_TABLES = ['lyrics', 'translations', 'audio', 'pdfs', 'videos'] as const;
export type ChildTable = (typeof CHILD_TABLES)[number];
