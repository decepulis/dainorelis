import { z } from 'zod';

export const LyricsSchema = z.object({
  'Variant Name': z.string({
    error: 'Lyrics variant name is required',
  }),
  'EN Variant Name': z.string({
    error: 'English lyrics variant name is required',
  }),
  'Lyrics & Chords': z.string({
    error: 'Lyrics and chords text is required',
  }),
  // TODO compute this automatically by detecting markdown links in the fetching phase
  'Show Chords': z.boolean().optional(),
  Notes: z.string().optional(),
});
export type Lyrics = z.infer<typeof LyricsSchema>;
