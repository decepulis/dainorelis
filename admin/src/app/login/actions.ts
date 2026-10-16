'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

import { redirectTarget } from './redirect-target';

/**
 * `email` comes back on an error so the form can keep it: React resets an
 * uncontrolled form once its action returns, and the field's default is what
 * the reset restores. Passwords are never sent back.
 */
export type LoginState = { error?: string; email?: string };

/**
 * Sign-ups are disabled in the Supabase dashboard, so this is sign-in only.
 * Editors are invited by hand — there are no roles and no self-registration.
 */
export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');

  if (!email || !password) return { error: 'Enter your email and password.', email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately vague: don't reveal whether the address has an account.
  if (error) return { error: 'That email and password combination did not work.', email };

  redirect(redirectTarget(next));
}

export type ResetState = { error?: string; sent?: boolean; email?: string };

/**
 * Emails a recovery link that lands on /auth/confirm, which signs the editor in
 * and sends them on to set a new password. Supabase answers the same way
 * whether or not the address has an account, so this can't be used to probe
 * for editors.
 *
 * No `redirectTo`: the README's template builds the link from the Site URL,
 * and /auth/confirm picks the destination from the link's `type`.
 */
export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Enter your email address.' };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) return { error: `Could not send the email: ${error.message}`, email };
  return { sent: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
