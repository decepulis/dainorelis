import { z } from 'zod';

export const AudioSchema = z.object({
  'Variant Name': z.string({
    error: 'Audio variant name is required',
  }),
  'EN Variant Name': z.string({
    error: 'English audio variant name is required',
  }),
  URL: z.string().url({
    error: 'Must be a valid audio URL',
  }),
  Album: z.string().optional(),
  Artist: z.string().optional(),
});
export type Audio = z.infer<typeof AudioSchema>;
