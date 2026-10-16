'use client';

import { useActionState } from 'react';

import Link from 'next/link';

import { type ConfirmState, confirmEmailLink } from './actions';
import type { EmailLinkType } from './email-link';

/**
 * Shown in place of the form when a link doesn't verify. It stays on this page
 * rather than redirecting to /login, which sends a signed-in editor straight
 * on to the song list without ever showing the message.
 */
export function LinkError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex flex-col gap-2 text-sm">
      <p className="text-red-600 dark:text-red-400">{message}</p>
      <p className="text-stone-600 dark:text-stone-300">
        Ask for a new invitation, or{' '}
        <Link href="/login/forgot" className="underline">
          request a new reset link
        </Link>
        . Already have a password?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}

export default function ConfirmForm({ tokenHash, type }: { tokenHash: string; type: EmailLinkType }) {
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(confirmEmailLink, {});

  if (state.error) return <LinkError message={state.error} />;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        {pending ? 'Signing in…' : 'Continue'}
      </button>
    </form>
  );
}
