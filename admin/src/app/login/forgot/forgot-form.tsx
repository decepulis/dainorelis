'use client';

import { useActionState } from 'react';

import { type ResetState, requestPasswordReset } from '../actions';

export default function ForgotForm() {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(requestPasswordReset, {});

  if (state.sent) {
    return (
      <p role="status" className="text-sm text-stone-600 dark:text-stone-300">
        If that address belongs to an editor, a reset link is on its way.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email}
          required
          autoFocus
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        {pending ? 'Sending…' : 'Email me a reset link'}
      </button>
    </form>
  );
}
