import { z } from 'zod';

export const LyricsSchema = z.object({
  'Variant Name': z.string(),
  'Lyrics & Chords': z.string(),
  'Show Chords': z.boolean().optional(),
});
export type Lyrics = z.infer<typeof LyricsSchema>;
