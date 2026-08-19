'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

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

  redirect(next.startsWith('/') ? next : '/');
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
