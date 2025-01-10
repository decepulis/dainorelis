import { z } from 'zod';

export const simpleAirtableAttachmentSchema = z.array(
  z.object({
    id: z.string(),
    url: z.string(),
    filename: z.string(),
    type: z.string(),
  })
);
