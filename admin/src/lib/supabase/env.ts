function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Safe to ship to the browser: RLS is what actually gates access. */
export const supabaseUrl = () => required('NEXT_PUBLIC_SUPABASE_URL');
export const supabaseAnonKey = () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY');

/** Server-only. Bypasses RLS — never import this from a client component. */
export const supabaseServiceRoleKey = () => required('SUPABASE_SERVICE_ROLE_KEY');

/** Shared secret the app's build script presents to `/api/export`. */
export const exportToken = () => required('EXPORT_TOKEN');
