/**
 * `Database` is generated from the live schema: run `pnpm gen:types` after
 * every migration (it needs `supabase login`). Don't edit database.types.ts
 * by hand.
 */
export type { Database } from './database.types';

/** The child tables, as the editor UI refers to them. */
export const CHILD_TABLES = ['lyrics', 'translations', 'audio', 'pdfs', 'videos'] as const;
export type ChildTable = (typeof CHILD_TABLES)[number];
