import { redirect } from 'next/navigation';

import { MEDIA_BASE_URL, isR2Configured, listMedia, mediaUrl } from '@/lib/r2';
import { createClient } from '@/lib/supabase/server';

import MediaList from './media-list';
import Uploader from './uploader';

/** Behind the editor layout, so only a signed-in editor can reach it. */
export default async function MediaPage() {
  // Next renders a page alongside its layout, so the layout's sign-in check
  // doesn't stop this one from listing the bucket.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const configured = isR2Configured();
  let items: { key: string; url: string; size: number; lastModified: string | null }[] = [];
  let error: string | null = null;
  if (configured) {
    try {
      items = (await listMedia()).map((object) => ({ ...object, url: mediaUrl(object.key) }));
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Media</h1>
      <p className="mt-1 mb-6 text-sm text-stone-500 dark:text-stone-400">
        Sheet music and audio served from <code>{MEDIA_BASE_URL.replace('https://', '')}</code>. Upload a file, then
        paste its URL into a song.
      </p>

      {!configured ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          The R2 bucket isn’t configured. Set the <code>R2_*</code> variables (see <code>admin/.env.example</code>).
        </p>
      ) : (
        <>
          <section className="mb-10 max-w-sm">
            <h2 className="mb-3 font-semibold">Upload</h2>
            <Uploader />
          </section>

          <h2 className="mb-3 font-semibold">
            Files <span className="font-normal text-stone-500 dark:text-stone-400">({items.length})</span>
          </h2>
          {error ? (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              Couldn’t list the bucket: {error}
            </p>
          ) : (
            <MediaList items={items} />
          )}
        </>
      )}
    </main>
  );
}
