'use client';

import { useActionState } from 'react';

import { PRIMARY_BUTTON } from '@/lib/styles';

import { type InviteState, inviteEditor } from './actions';

export default function InviteForm() {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(inviteEditor, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="off" required defaultValue={state.email} />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      {state.invited ? (
        <p role="status" className="text-sm text-stone-600 dark:text-stone-300">
          Invitation sent to {state.invited}.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? 'Sending…' : 'Send invitation'}
      </button>
    </form>
  );
}
