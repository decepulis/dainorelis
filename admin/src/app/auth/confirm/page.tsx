import ConfirmForm, { LinkError } from './confirm-form';
import { LINK_ERROR, isEmailLinkType } from './email-link';

const COPY = {
  invite: { title: 'Accept your invitation', body: 'Continue to sign in and choose a password.' },
  recovery: { title: 'Reset your password', body: 'Continue to sign in and choose a new password.' },
};

/**
 * Landing page for Supabase's auth emails (invite, password reset). See the
 * README for the template URLs.
 *
 * The token is single-use, and mail security scanners (Safe Links, Mimecast,
 * corporate gateways) fetch every link in a message before the recipient
 * does. A GET that verified the token would spend it on the scanner, so the
 * GET only renders a button, and the POST behind it verifies.
 */
export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string | string[]; type?: string | string[] }>;
}) {
  const { token_hash: tokenHash, type } = await searchParams;
  const valid = typeof tokenHash === 'string' && tokenHash.length > 0 && isEmailLinkType(type);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{valid ? COPY[type].title : 'Dainorėlis'}</h1>
        {valid ? <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{COPY[type].body}</p> : null}
      </div>

      {valid ? <ConfirmForm tokenHash={tokenHash} type={type} /> : <LinkError message={LINK_ERROR} />}
    </main>
  );
}
