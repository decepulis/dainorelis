import Link from 'next/link';

import { TEXT_LINK } from '@/lib/styles';

import ForgotForm from './forgot-form';

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
          We’ll email you a link that signs you in and lets you choose a new one.
        </p>
      </div>

      <ForgotForm />

      <Link href="/login" className={`text-sm ${TEXT_LINK}`}>
        ← Back to sign in
      </Link>
    </main>
  );
}
