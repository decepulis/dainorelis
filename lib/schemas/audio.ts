import { z } from 'zod';

export const AudioSchema = z.object({
  'Variant Name': z.string(),
  URL: z.string().url(),
});
export type Audio = z.infer<typeof AudioSchema>;
