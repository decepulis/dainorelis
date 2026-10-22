import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { supabaseSecretKey, supabaseUrl } from './env';
import type { Database } from './types';

/**
 * Service-role client, used by `/api/export`, the import scripts and the
 * Editors page.
 *
 * Export and the scripts authenticate with a shared token rather than a
 * Supabase session, so they have no `auth.uid()` for the RLS policies to match
 * and must bypass RLS instead. The Editors page needs it for the auth admin
 * API, and checks for a signed-in editor first. Keep this out of anything that
 * reaches the browser.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
