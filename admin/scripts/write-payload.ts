import { createServiceClient } from '../src/lib/supabase/service';
import { CHILD_TABLES } from '../src/lib/supabase/types';
import type { ImportPayload } from './rows';

const BATCH_SIZE = 200;

async function batched<T>(rows: T[], write: (chunk: T[]) => Promise<void>) {
  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    await write(rows.slice(index, index + BATCH_SIZE));
  }
}

/**
 * Replaces the contents of the database with `payload`.
 *
 * Deleting songs cascades to every child table, so the child deletes are
 * implicit. This is a full replace rather than an upsert: the importer is for
 * seeding and re-seeding, and a partial merge would silently keep rows that
 * were deleted upstream.
 */
export async function writePayload(payload: ImportPayload, { replace }: { replace: boolean }) {
  const supabase = createServiceClient();

  if (replace) {
    const { error } = await supabase.from('songs').delete().neq('id', '');
    if (error) throw new Error(`Failed to clear existing songs: ${error.message}`);
  }

  await batched(payload.songs, async (chunk) => {
    const { error } = await supabase.from('songs').upsert(chunk);
    if (error) throw new Error(`Failed to write songs: ${error.message}`);
  });

  for (const table of CHILD_TABLES) {
    await batched(payload[table], async (chunk) => {
      // Rows are built per table by the importers; the loop erases which.
      const { error } = await supabase.from(table).upsert(chunk as never);
      if (error) throw new Error(`Failed to write ${table}: ${error.message}`);
    });
  }
}
