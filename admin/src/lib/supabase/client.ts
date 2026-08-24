'use client';

import { createBrowserClient } from '@supabase/ssr';

import { supabaseAnonKey, supabaseUrl } from './env';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
