import { createInterface } from 'node:readline/promises';

import { supabaseUrl } from '../src/lib/supabase/env';
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
 * Both importers default to `.env.local`, which after `vercel env pull` holds
 * the production keys. A replace there permanently loses hidden songs, tags and
 * sources that no other copy carries, so say where we are about to write and
 * make the operator opt in. The flags are shared by every importer, so they are
 * read here rather than threaded through each one.
 *
 *   --force  allow replacing a songs table that already has rows
 *   --yes    skip the confirmation prompt (required when stdin is not a TTY)
 */
async function confirmDestructiveWrite(supabase: ReturnType<typeof createServiceClient>) {
  const force = process.argv.includes('--force');
  const yes = process.argv.includes('--yes');

  const { count, error } = await supabase.from('songs').select('id', { count: 'exact', head: true });
  if (error) throw new Error(`Failed to count existing songs: ${error.message}`);
  const existing = count ?? 0;

  console.log(`🎯 Target: ${supabaseUrl()}`);
  console.log(`   songs currently in the table: ${existing}`);

  if (existing > 0 && !force) {
    throw new Error(
      `The songs table is not empty. Re-run with --force to delete all ${existing} songs and replace them.`
    );
  }

  if (yes) return;

  if (!process.stdin.isTTY) {
    throw new Error('Refusing to write without confirmation. Re-run with --yes.');
  }

  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`Replace the contents of ${supabaseUrl()}? Type "yes" to continue: `);
  prompt.close();

  if (answer.trim().toLowerCase() !== 'yes') {
    throw new Error('Aborted; nothing was written.');
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

  await confirmDestructiveWrite(supabase);
  console.log(`✍️  Writing to Supabase${replace ? ' (replacing existing rows)' : ''}…`);

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
