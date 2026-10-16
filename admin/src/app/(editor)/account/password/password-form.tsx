'use client';

import { useActionState } from 'react';

import { PRIMARY_BUTTON } from '@/lib/styles';

import { type PasswordState, updatePassword } from './actions';

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(updatePassword, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="password">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required autoFocus />
      </div>

      <div>
        <label htmlFor="confirm">Repeat it</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? 'Saving…' : 'Set password'}
      </button>
    </form>
  );
}
