import { z } from 'zod';

export const PDFsSchema = z.object({
  'Variant Name': z.string(),
  URL: z.string().url(),
});
export type PDFs = z.infer<typeof PDFsSchema>;
