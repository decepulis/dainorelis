'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export type PasswordState = { error?: string };

/**
 * Sets the signed-in editor's password. Invited editors arrive here from
 * /auth/confirm with a session but no password, and so do editors following a
 * reset link; anyone already signed in can also use it to change theirs.
 */
export async function updatePassword(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');

  if (!password) return { error: 'Enter a new password.' };
  if (password !== confirm) return { error: 'The two passwords don’t match.' };

  const supabase = await createClient();
  // Supabase enforces the length and strength rules set in the dashboard, and
  // its messages say which one failed.
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect('/');
}
