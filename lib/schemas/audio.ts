import { z } from 'zod';

export const AudioSchema = z.object({
  'Variant Name': z.string(),
  URL: z.string().url(),
  Album: z.string().optional(),
  Artist: z.string().optional(),
});
export type Audio = z.infer<typeof AudioSchema>;
