'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { CHILD_TABLES, type ChildTable } from '@/lib/supabase/types';

/**
 * The whole song editor is one form, so a structural change (adding a variant,
 * reordering, deleting) has to persist the operator's in-progress text edits
 * first — otherwise clicking "Add" would silently discard them. Every action
 * therefore receives the complete FormData and saves it before acting on the
 * `intent` of the button that was clicked.
 */

/** Columns the editor is allowed to write, per table. */
const COLUMNS = {
  lyrics: ['variant_name', 'en_variant_name', 'lyrics_and_chords', 'show_chords', 'notes'],
  translations: ['variant_name', 'en_variant_name', 'title', 'lyrics', 'ai_generated', 'notes'],
  audio: ['variant_name', 'en_variant_name', 'url', 'album', 'artist'],
  pdfs: ['variant_name', 'en_variant_name', 'url'],
  videos: ['variant_name', 'en_variant_name', 'youtube_link'],
} as const satisfies Record<ChildTable, readonly string[]>;

const BOOLEAN_COLUMNS = new Set(['show_chords', 'ai_generated']);
const URL_COLUMNS = new Set(['url', 'youtube_link']);

/** Field names are `table:recordId:column`; ids are alphanumeric so `:` is safe. */
const FIELD_SEPARATOR = ':';

const urlSchema = z.string().url();

/** Blank text is stored as NULL, because the export treats absent and blank alike. */
function nullable(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

/** Comma-separated in the UI, `text[]` in Postgres. */
function toList(value: FormDataEntryValue | null): string[] | null {
  const items = String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : null;
}

function isChildTable(value: string): value is ChildTable {
  return (CHILD_TABLES as readonly string[]).includes(value);
}

class ValidationError extends Error {}

/** Collects `table:id:column` entries back into per-record update payloads. */
function collectChildUpdates(formData: FormData) {
  const updates = new Map<ChildTable, Map<string, Record<string, unknown>>>();

  for (const [key, rawValue] of formData.entries()) {
    const parts = key.split(FIELD_SEPARATOR);
    if (parts.length !== 3) continue;

    const [table, id, column] = parts;
    if (!isChildTable(table)) continue;
    if (!(COLUMNS[table] as readonly string[]).includes(column)) continue;

    const byId = updates.get(table) ?? new Map<string, Record<string, unknown>>();
    const record = byId.get(id) ?? {};

    if (BOOLEAN_COLUMNS.has(column)) {
      record[column] = String(rawValue) === 'on' || String(rawValue) === 'true';
    } else if (URL_COLUMNS.has(column)) {
      const url = String(rawValue ?? '').trim();
      if (!urlSchema.safeParse(url).success) {
        throw new ValidationError(
          `“${url || 'empty'}” is not a valid URL. The app refuses to build with an invalid ${table} link.`
        );
      }
      record[column] = url;
    } else if (column === 'lyrics_and_chords' || column === 'lyrics') {
      // Lyrics keep their whitespace; only line endings are normalised.
      record[column] = String(rawValue ?? '').replace(/\r\n/g, '\n');
    } else {
      record[column] = nullable(rawValue);
    }

    byId.set(id, record);
    updates.set(table, byId);
  }

  // Unchecked checkboxes are simply absent from FormData, so default them off
  // for every record that appeared at all.
  for (const [table, byId] of updates) {
    for (const [, record] of byId) {
      for (const column of COLUMNS[table]) {
        if (BOOLEAN_COLUMNS.has(column) && !(column in record)) record[column] = false;
      }
    }
  }

  return updates;
}

async function persist(formData: FormData) {
  const songId = String(formData.get('songId') ?? '');
  if (!songId) throw new ValidationError('Missing song id.');

  const supabase = await createClient();

  const name = nullable(formData.get('name'));
  if (!name) throw new ValidationError('A song needs a name.');

  // Collect and validate the children first. This throws on a bad URL, which
  // would otherwise leave the song row updated and its variants untouched.
  const childUpdates = collectChildUpdates(formData);

  const { error: songError } = await supabase
    .from('songs')
    .update({
      name,
      tags: toList(formData.get('tags')),
      sources: toList(formData.get('sources')),
      recommended_key: nullable(formData.get('recommended_key')),
      music_author: nullable(formData.get('music_author')),
      text_author: nullable(formData.get('text_author')),
      lt_description: nullable(formData.get('lt_description')),
      en_description: nullable(formData.get('en_description')),
      hide: formData.get('hide') === 'on',
    })
    .eq('id', songId);

  if (songError) throw new Error(songError.message);

  for (const [table, byId] of childUpdates) {
    for (const [id, values] of byId) {
      // `values` is assembled from the COLUMNS allowlist above, so it is
      // known-good for this table even though its type is dynamic.
      const { error } = await supabase
        .from(table)
        .update(values as never)
        .eq('id', id)
        .eq('song_id', songId);
      if (error) throw new Error(`Failed to save ${table}: ${error.message}`);
    }
  }

  return { supabase, songId };
}

export type EditorState = { error?: string; savedAt?: number };

/**
 * Single entry point for the song editor form. `intent` carries the structural
 * change requested by whichever submit button was clicked.
 */
export async function saveSong(_prev: EditorState, formData: FormData): Promise<EditorState> {
  let songId = '';

  try {
    const result = await persist(formData);
    const supabase = result.supabase;
    songId = result.songId;

    const intent = String(formData.get('intent') ?? 'save');
    const [action, table, recordId] = intent.split(FIELD_SEPARATOR);

    if (action === 'add' && isChildTable(table)) {
      const { data: siblings, error } = await supabase
        .from(table)
        .select('position')
        .eq('song_id', songId)
        .order('position', { ascending: false })
        .limit(1);
      if (error) throw new Error(error.message);

      const nextPosition = (siblings?.[0]?.position ?? -1) + 1;
      const { error: insertError } = await supabase
        .from(table)
        .insert({ song_id: songId, position: nextPosition } as never);
      if (insertError) throw new Error(insertError.message);
    }

    if (action === 'delete' && isChildTable(table) && recordId) {
      const { error } = await supabase.from(table).delete().eq('id', recordId).eq('song_id', songId);
      if (error) throw new Error(error.message);
    }

    if ((action === 'up' || action === 'down') && isChildTable(table) && recordId) {
      await swapPositions(supabase, table, songId, recordId, action);
    }
  } catch (error) {
    if (error instanceof ValidationError) return { error: error.message };
    return { error: error instanceof Error ? error.message : 'Something went wrong.' };
  }

  revalidatePath(`/songs/${songId}`);
  revalidatePath('/');
  return { savedAt: Date.now() };
}

/**
 * Variant order is user-visible: it sets the key order in the exported JSON and
 * the number in auto-generated names like "Žodžiai 2".
 */
async function swapPositions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: ChildTable,
  songId: string,
  recordId: string,
  direction: 'up' | 'down'
) {
  const { data: rows, error } = await supabase
    .from(table)
    .select('id, position')
    .eq('song_id', songId)
    .order('position', { ascending: true });

  if (error) throw new Error(error.message);
  if (!rows) return;

  const index = rows.findIndex((row) => row.id === recordId);
  const swapWith = direction === 'up' ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return;

  // Renumber the whole list so imported gaps and duplicates settle into a
  // clean 0..n-1 sequence.
  const reordered = [...rows];
  [reordered[index], reordered[swapWith]] = [reordered[swapWith], reordered[index]];

  for (const [position, row] of reordered.entries()) {
    const { error: updateError } = await supabase.from(table).update({ position }).eq('id', row.id);
    if (updateError) throw new Error(updateError.message);
  }
}

export async function createSong(formData: FormData) {
  const name = nullable(formData.get('name')) ?? 'Nauja daina';
  const supabase = await createClient();

  const { data, error } = await supabase.from('songs').insert({ name }).select('id').single();
  if (error) throw new Error(error.message);

  // A song with no lyrics fails the app's schema, so start it with one variant.
  await supabase.from('lyrics').insert({ song_id: data.id, position: 0 });

  revalidatePath('/');
  redirect(`/songs/${data.id}`);
}

export async function deleteSong(formData: FormData) {
  const songId = String(formData.get('songId') ?? '');
  if (!songId) return;

  const supabase = await createClient();
  const { error } = await supabase.from('songs').delete().eq('id', songId);
  if (error) throw new Error(error.message);

  revalidatePath('/');
  redirect('/');
}
