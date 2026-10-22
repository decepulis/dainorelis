'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

/** `email` comes back on an error so the form can keep it (see LoginState). */
export type InviteState = { error?: string; invited?: string; email?: string };

const emailSchema = z.string().email();

/**
 * Emails an invitation that lands on /auth/confirm, where the new editor
 * chooses a password. Sign-ups are off, so this (or the Supabase dashboard) is
 * the only way in, and anyone already signed in may use it: there are no roles.
 */
export async function inviteEditor(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!emailSchema.safeParse(email).success) return { error: 'Enter an email address.', email };

  // The proxy gates this route, but a server action is a public POST endpoint,
  // and the service client below bypasses every policy.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Your session has expired. Sign in again.', email };

  const { error } = await createServiceClient().auth.admin.inviteUserByEmail(email);
  if (error) {
    if (error.code === 'email_exists') return { error: `${email} already has an account.`, email };
    return { error: error.message, email };
  }

  revalidatePath('/editors');
  return { invited: email };
}
