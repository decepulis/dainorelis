import { z } from 'zod';

export const VideosSchema = z.object({
  'Variant Name': z.string().optional(),
  'YouTube Link': z.string().url(),
});
export type Videos = z.infer<typeof VideosSchema>;
