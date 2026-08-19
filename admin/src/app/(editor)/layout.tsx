import Link from 'next/link';
import { redirect } from 'next/navigation';

import { signOut } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/server';

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The middleware already redirects, but a layout-level check means a missing
  // matcher can never expose the editor.
  if (!user) redirect('/login');

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-10 flex items-center gap-4 border-b border-stone-200
          bg-stone-50/90 px-4 py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90"
      >
        <Link href="/" className="font-semibold tracking-tight">
          Dainorėlis
        </Link>
        <nav className="flex items-center gap-3 text-sm text-stone-500 dark:text-stone-400">
          <Link href="/" className="hover:text-stone-900 dark:hover:text-stone-100">
            Songs
          </Link>
          <Link href="/export" className="hover:text-stone-900 dark:hover:text-stone-100">
            Export
          </Link>
        </nav>
        <form action={signOut} className="ml-auto">
          <button
            type="submit"
            className="text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400
              dark:hover:text-stone-100"
          >
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
