import { z } from 'zod';

export const VideosSchema = z.object({
  'Variant Name': z.string({
    error: 'Video variant name is required',
  }),
  'EN Variant Name': z.string({
    error: 'English video variant name is required',
  }),
  'YouTube Link': z.string().url({
    error: 'Must be a valid YouTube URL',
  }),
});
export type Videos = z.infer<typeof VideosSchema>;
