import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

import InviteForm from './invite-form';

/** Behind the editor layout, so only a signed-in editor can reach it. */
export default async function EditorsPage() {
  // Next renders a page alongside its layout, so the layout's sign-in check
  // doesn't stop this one from querying with the service client.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Listing accounts needs the service client; there's no RLS on auth.users.
  const { data, error } = await createServiceClient().auth.admin.listUsers({ perPage: 1000 });
  const editors = [...(data?.users ?? [])].sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));

  return (
    <main className="mx-auto w-full max-w-sm p-4 sm:p-6">
      <h1 className="text-xl font-semibold tracking-tight">Editors</h1>
      <p className="mt-1 mb-4 text-sm text-stone-500 dark:text-stone-400">
        Everyone here can edit every song. Remove someone from Supabase’s Authentication → Users.
      </p>

      {error ? (
        <p role="alert" className="mb-6 text-sm text-red-600 dark:text-red-400">
          Couldn’t load the editor list: {error.message}
        </p>
      ) : (
        <ul className="mb-8 divide-y divide-stone-200 text-sm dark:divide-stone-800">
          {editors.map((editor) => (
            <li key={editor.id} className="flex items-baseline gap-3 py-2">
              <span className="min-w-0 truncate">{editor.email}</span>
              <span className="ml-auto shrink-0 text-xs text-stone-500 dark:text-stone-400">
                {editor.last_sign_in_at ? 'active' : 'invited'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-1 font-semibold">Invite an editor</h2>
      <p className="mb-4 text-sm text-stone-500 dark:text-stone-400">
        They’ll get an email with a link to choose a password.
      </p>
      <InviteForm />
    </main>
  );
}
