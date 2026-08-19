/**
 * Shared row-mapping for the importers.
 *
 * Both importers land data in the same shape, and both deliberately store
 * *unresolved* values: blank variant names stay blank, chord whitespace stays
 * un-widened. Those transforms belong to the export, and applying them at
 * import time would bake them in permanently and make the stored data lie
 * about what the editor typed.
 */

export type SongInsert = {
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
};

export type ChildInsert = {
  id: string;
  song_id: string;
  position: number;
} & Record<string, unknown>;

export type ImportPayload = {
  songs: SongInsert[];
  lyrics: ChildInsert[];
  translations: ChildInsert[];
  audio: ChildInsert[];
  pdfs: ChildInsert[];
  videos: ChildInsert[];
};

export function emptyPayload(): ImportPayload {
  return { songs: [], lyrics: [], translations: [], audio: [], pdfs: [], videos: [] };
}

export function str(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? value : null;
}

export function list(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const items = value.filter((item): item is string => typeof item === 'string');
  return items.length > 0 ? items : null;
}

export function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

export function summarize(payload: ImportPayload): string {
  return [
    `${payload.songs.length} songs`,
    `${payload.lyrics.length} lyrics`,
    `${payload.translations.length} translations`,
    `${payload.audio.length} audio`,
    `${payload.pdfs.length} pdfs`,
    `${payload.videos.length} videos`,
  ].join(', ');
}
