'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { redirectTarget } from './redirect-target';

export type LoginState = { error?: string };

/**
 * Sign-ups are disabled in the Supabase dashboard, so this is sign-in only.
 * Editors are invited by hand — there are no roles and no self-registration.
 */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');

  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately vague: don't reveal whether the address has an account.
  if (error) return { error: 'That email and password combination did not work.' };

  redirect(redirectTarget(next));
}

export type ResetState = { error?: string; sent?: boolean };

/**
 * Emails a recovery link that lands on /auth/confirm, which signs the editor in
 * and sends them on to set a new password. Supabase answers the same way
 * whether or not the address has an account, so this can't be used to probe
 * for editors.
 */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Enter your email address.' };

  // The README's recovery template builds its link from the Site URL, so this
  // only matters to a template that uses {{ .RedirectTo }}. Server actions are
  // same-origin POSTs (Next rejects any other), so Origin is this deployment.
  const origin = (await headers()).get('origin') ?? '';

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/account/password`,
  });

  if (error) return { error: `Could not send the email: ${error.message}` };
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
