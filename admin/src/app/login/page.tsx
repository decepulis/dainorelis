import LoginForm from './login-form';

/**
 * Server component so the `next` redirect target comes off the request rather
 * than `useSearchParams`, which would force the whole page behind a Suspense
 * boundary for no benefit.
 */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;

  // Only ever redirect within this app.
  const target = next && next.startsWith('/') ? next : '/';

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dainorėlis</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Sign in to edit the song database.</p>
      </div>

      <LoginForm next={target} />
    </main>
  );
}
