import { z } from 'zod';

export const TranslationsSchema = z.object({
  Title: z.string(),
  'Variant Name': z.string(),
  Lyrics: z.string(),
  'AI Generated': z.boolean().optional(),
  Notes: z.string().optional(),
});
export type Translations = z.infer<typeof TranslationsSchema>;
