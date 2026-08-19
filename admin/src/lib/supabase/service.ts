import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { supabaseServiceRoleKey, supabaseUrl } from './env';
import type { Database } from './types';

/**
 * Service-role client, used only by `/api/export` and the import scripts.
 *
 * These callers authenticate with a shared token rather than a Supabase
 * session, so they have no `auth.uid()` for the RLS policies to match and must
 * bypass RLS instead. Keep this out of anything that reaches the browser.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
