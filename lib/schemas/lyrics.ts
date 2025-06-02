import { z } from 'zod';

export const LyricsSchema = z.object({
  'Variant Name': z.string(),
  'EN Variant Name': z.string(),
  'Lyrics & Chords': z.string(),
  // TODO compute this automatically by detecting markdown links in the fetching phase
  'Show Chords': z.boolean().optional(),
  Notes: z.string().optional(),
});
export type Lyrics = z.infer<typeof LyricsSchema>;
