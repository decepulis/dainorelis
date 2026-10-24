import PasswordForm from './password-form';

/** Behind the editor layout, so only a signed-in editor can reach it. */
export default function PasswordPage() {
  return (
    <main className="mx-auto w-full max-w-sm p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Set your password</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500 dark:text-stone-400">
        You’ll use it with your email address to sign in from now on.
      </p>

      <PasswordForm />
    </main>
  );
}
