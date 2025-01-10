import { z } from 'zod';

import { simpleAirtableAttachmentSchema } from './attachment';

export const PDFsSchema = z.object({
  'Variant Name': z.string().optional(),
  File: simpleAirtableAttachmentSchema,
});
export type PDFs = z.infer<typeof PDFsSchema>;
