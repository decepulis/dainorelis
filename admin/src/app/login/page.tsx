import LoginForm from './login-form';
import { redirectTarget } from './redirect-target';

/**
 * Server component so the `next` redirect target comes off the request rather
 * than `useSearchParams`, which would force the whole page behind a Suspense
 * boundary for no benefit.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const target = redirectTarget(next);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dainorėlis</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Sign in to edit the song database.</p>
      </div>

      {/* Set by /auth/confirm when an invite or reset link doesn't verify. */}
      {error === 'link' ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          That link is invalid or has expired. Ask for a new invitation, or reset your password below.
        </p>
      ) : null}

      <LoginForm next={target} />
    </main>
  );
}
