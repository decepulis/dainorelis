import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BrandMark, Wordmark } from '@/app/brand';
import { signOut } from '@/app/login/actions';
import { createClient } from '@/lib/supabase/server';

export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already redirects, but a layout-level check means a missing
  // matcher can never expose the editor.
  if (!user) redirect('/login');

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-10 flex items-baseline gap-4 bg-header px-4 py-3 text-white shadow-sm
          [&_:focus-visible]:outline-white"
      >
        {/* Everything shares the text baseline; the mark sits 3px below it so it
            centres on the wordmark's capitals. */}
        <Link href="/" className="flex items-baseline gap-2">
          <BrandMark className="relative top-[3px] size-5" />
          <Wordmark className="text-xl leading-none" />
          <span className="text-sm font-medium">admin</span>
        </Link>
        <nav className="flex items-baseline gap-3 text-sm">
          <Link href="/" className="underline-offset-4 hover:underline">
            Songs
          </Link>
          <Link href="/export" className="underline-offset-4 hover:underline">
            Export
          </Link>
          <Link href="/editors" className="underline-offset-4 hover:underline">
            Editors
          </Link>
        </nav>
        <Link href="/account/password" className="ml-auto text-sm underline-offset-4 hover:underline">
          Password
        </Link>
        <form action={signOut}>
          <button type="submit" className="text-sm underline-offset-4 hover:underline">
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
