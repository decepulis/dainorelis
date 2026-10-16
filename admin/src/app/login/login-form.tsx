'use client';

import { useActionState } from 'react';

import Link from 'next/link';

import { PRIMARY_BUTTON } from '@/lib/styles';

import { type LoginState, signIn } from './actions';

export default function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

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

      <div>
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <Link
          href="/login/forgot"
          className="mt-1 inline-block text-xs text-stone-500 hover:underline dark:text-stone-400"
        >
          Forgot your password?
        </Link>
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
