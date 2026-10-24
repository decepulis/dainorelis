import { z } from 'zod';

export const TranslationsSchema = z.object({
  Title: z.string({
    error: 'Translation title is required',
  }),
  'Variant Name': z.string({
    error: 'Translation variant name is required',
  }),
  'EN Variant Name': z.string({
    error: 'English translation variant name is required',
  }),
  Lyrics: z.string({
    error: 'Translation lyrics text is required',
  }),
  'AI Generated': z.boolean().optional(),
  Notes: z.string().optional(),
});
export type Translations = z.infer<typeof TranslationsSchema>;
