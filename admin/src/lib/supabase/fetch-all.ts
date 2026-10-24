import type { PostgrestError } from '@supabase/supabase-js';

/**
 * PostgREST caps a single response at the project's max rows (1000 by default)
 * and truncates silently, so any query that can outgrow that walks the table
 * in pages instead.
 */
const PAGE_SIZE = 500;

type Page<T> = { data: T[] | null; error: PostgrestError | null };

/**
 * `query(from, to)` must apply `.range(from, to)` to an order that is total —
 * end it with a unique column such as `id` — or rows can be skipped or repeated
 * across a page boundary. Resolves like a supabase-js query, so callers keep
 * their usual `{ data, error }` handling.
 */
export async function fetchAll<T>(
  query: (from: number, to: number) => PromiseLike<Page<T>>
): Promise<{ data: T[]; error: null } | { data: null; error: PostgrestError }> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query(from, from + PAGE_SIZE - 1);
    if (error) return { data: null, error };
    if (!data || data.length === 0) break;

    rows.push(...data);
    if (data.length < PAGE_SIZE) break;
  }

  return { data: rows, error: null };
}
