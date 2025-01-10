import { z } from 'zod';

export const LyricsSchema = z.object({
  'Variant Name': z.string().optional(),
  'Lyrics & Chords': z.string().optional(),
  'Show Chords': z.boolean().optional(),
});
export type Lyrics = z.infer<typeof LyricsSchema>;
