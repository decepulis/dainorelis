/**
 * Every variable is read as a literal `process.env.NAME`. Next only inlines
 * `NEXT_PUBLIC_*` values for the browser when it can see the name statically,
 * so a dynamic `process.env[name]` lookup would come back undefined there.
 */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Safe to ship to the browser: RLS is what actually gates access. */
export const supabaseUrl = () => required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * The Supabase Vercel integration provides the new publishable/secret key
 * names. The legacy anon/service_role names are still read as a fallback until
 * Supabase retires those keys.
 */
export const supabasePublishableKey = () =>
  required(
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

/** Server-only. Bypasses RLS — never import this from a client component. */
export const supabaseSecretKey = () =>
  required(
    'SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY)',
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  );

/** Shared secret the app's build script presents to `/api/export`. */
export const exportToken = () => required('EXPORT_TOKEN', process.env.EXPORT_TOKEN);
