import { z } from 'zod';

import { simpleAirtableAttachmentSchema } from './attachment';

export const AudioSchema = z.object({
  'Variant Name': z.string(),
  File: simpleAirtableAttachmentSchema,
});
export type Audio = z.infer<typeof AudioSchema>;
