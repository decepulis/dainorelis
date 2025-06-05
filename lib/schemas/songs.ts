import { z } from 'zod';
import { LyricsSchema } from './lyrics';
import { TranslationsSchema } from './translations';
import { VideosSchema } from './videos';
import { AudioSchema } from './audio';
import { PDFsSchema } from './pdfs';

export const SongSchema = z.object({
  id: z.string(),
  fields: z.object({
    Name: z.string(),
    Lyrics: z.record(LyricsSchema),
    Videos: z.record(VideosSchema),
    Audio: z.record(AudioSchema),
    PDFs: z.record(PDFsSchema),
    Translations: z.record(TranslationsSchema),
    Tags: z.array(z.string()).optional(),
    Sources: z.array(z.string()).optional(),
    'Recommended Key': z.string().optional(),
    'Music Author': z.string().optional(),
    'Text Author': z.string().optional(),
    'LT Description': z.string().optional(),
    'EN Description': z.string().optional(),
    'AI-Generated Description': z.boolean().optional(),
  }),
});
export type Song = z.infer<typeof SongSchema>;

export const SongFileSchema = z.array(SongSchema);
export type SongFile = z.infer<typeof SongFileSchema>;
