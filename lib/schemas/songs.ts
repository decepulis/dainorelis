import { z } from 'zod';

export const SongSchema = z.object({
  id: z.string(),
  fields: z.object({
    Song: z.string().optional(),
    Lyrics: z.string().optional(),
    Source: z.array(z.string()).optional(),
    Genre: z.array(z.string()).optional(),
    'Recommended key': z.string().optional(),
    'Music author': z.string().optional(),
    'Text author': z.string().optional(),
    YouTube: z.string().url().optional(),
  }),
});
export type Song = z.infer<typeof SongSchema>;
export const SongFileSchema = z.array(SongSchema);
export type SongFile = z.infer<typeof SongFileSchema>;
