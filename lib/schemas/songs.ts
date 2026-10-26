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
    Lyrics: z.record(z.string(), LyricsSchema),
    Videos: z.record(z.string(), VideosSchema).optional(),
    Audio: z.record(z.string(), AudioSchema),
    PDFs: z.record(z.string(), PDFsSchema),
    Translations: z.record(z.string(), TranslationsSchema),
    Tags: z.array(z.string()).optional(),
    Sources: z.array(z.string()).optional(),
    'Recommended Key': z.string().optional(),
    'Music Author': z.string().optional(),
    'Text Author': z.string().optional(),
    'LT Description': z.string().optional(),
    'EN Description': z.string().optional(),
  }),
});
export type Song = z.infer<typeof SongSchema>;

export const SongFileSchema = z.array(SongSchema);
export type SongFile = z.infer<typeof SongFileSchema>;
