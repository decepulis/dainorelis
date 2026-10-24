'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { LINK_ERROR, SET_PASSWORD_PATH, isEmailLinkType } from './email-link';

export type ConfirmState = { error?: string };

/**
 * Spends the one-time token from an invite or reset email and signs the
 * editor in. The session is created here and written to cookies, so the
 * browser never sees a token in a URL fragment.
 */
export async function confirmEmailLink(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const tokenHash = String(formData.get('token_hash') ?? '');
  const type = formData.get('type');

  // The form is the client's to tamper with, so the page's checks run again.
  if (!tokenHash || !isEmailLinkType(type)) return { error: LINK_ERROR };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  // Expired, already used, or mangled by a mail client.
  if (error) return { error: LINK_ERROR };

  redirect(SET_PASSWORD_PATH);
}
