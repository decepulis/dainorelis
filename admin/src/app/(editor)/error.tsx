'use client';

import { useEffect } from 'react';

import Link from 'next/link';

/**
 * Catches what the editor pages and the create/delete actions throw on a
 * database error, inside the editor layout so the header stays usable. In
 * production a server error's message is replaced by a generic one; `digest`
 * matches it to the Vercel function logs.
 */
export default function EditorError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest = error instanceof Error && 'digest' in error ? String(error.digest) : null;

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Something went wrong</h1>
      <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
        {error instanceof Error ? error.message : 'An unexpected error occurred.'}
      </p>
      {digest ? <p className="mt-1 font-mono text-xs text-stone-500 dark:text-stone-400">Reference: {digest}</p> : null}

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          Try again
        </button>
        <Link href="/" className="text-sm text-stone-500 hover:underline dark:text-stone-400">
          ← All songs
        </Link>
      </div>
    </main>
  );
}
