import type { EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';

import { redirectTarget } from '@/app/login/redirect-target';
import { createClient } from '@/lib/supabase/server';

/** Invited and recovering editors land here with no password they know yet. */
const SET_PASSWORD_PATH = '/account/password';

/**
 * Landing route for Supabase's auth emails (invite, password reset). The email
 * templates link here with a `token_hash` rather than to Supabase's own verify
 * endpoint, so the session is created server-side and written to cookies —
 * the browser never sees a token in a URL fragment. See the README for the
 * template URLs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      const fallback = type === 'invite' || type === 'recovery' ? SET_PASSWORD_PATH : '/';
      redirect(redirectTarget(searchParams.get('next') ?? fallback));
    }
  }

  // Expired, already used, or mangled by a mail client.
  redirect('/login?error=link');
}
