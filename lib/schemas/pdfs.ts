import { z } from 'zod';

export const PDFsSchema = z.object({
  'Variant Name': z.string({
    error: 'PDF variant name is required',
  }),
  'EN Variant Name': z.string({
    error: 'English PDF variant name is required',
  }),
  URL: z.string().url({
    error: 'Must be a valid PDF URL',
  }),
});
export type PDFs = z.infer<typeof PDFsSchema>;
