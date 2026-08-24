import { NextResponse } from 'next/server';

import { buildSongFileFromDatabase } from '@/lib/song-file/query';
import { exportToken } from '@/lib/supabase/env';
import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Constant-time compare so the token can't be probed a byte at a time. */
function tokenMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * The song file, exactly as the app's `scripts/update-songs.ts` expects it.
 *
 * This is the single source of truth for the Airtable-era transforms (variant
 * naming, chord whitespace, hidden-song filtering, name ordering). The app
 * decides separately which fields it actually bundles.
 */
export async function GET(request: Request) {
  const authorization = request.headers.get('authorization') ?? '';
  const provided = authorization.replace(/^Bearer\s+/i, '');

  if (!provided || !tokenMatches(provided, exportToken())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const songs = await buildSongFileFromDatabase(createServiceClient());

  return NextResponse.json(songs, {
    headers: { 'cache-control': 'no-store' },
  });
}
