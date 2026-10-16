import { NextResponse } from 'next/server';

import { createServiceClient } from '@/lib/supabase/service';

export const dynamic = 'force-dynamic';

/**
 * Keep-alive for Supabase's free tier, which pauses a project after seven days
 * of inactivity and then requires a manual un-pause from the dashboard. A daily
 * cron (see vercel.json) issues one trivial query, which is enough to keep the
 * project counted as active. Doubles as a health check.
 *
 * Vercel sends `Authorization: Bearer $CRON_SECRET` on cron invocations when
 * that variable is set, so setting it closes the endpoint off. In production
 * it fails closed when unset, since an open endpoint runs a service-role query
 * for anyone; outside production it stays open so local development is simple.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  if (cronSecret) {
    const provided = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (provided !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const started = Date.now();
  const { count, error } = await createServiceClient().from('songs').select('id', { count: 'exact', head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json(
    { ok: true, songs: count ?? 0, durationMs: Date.now() - started },
    { headers: { 'cache-control': 'no-store' } }
  );
}
