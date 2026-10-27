'use server';

import { z } from 'zod';

import { mediaExists, mediaUrl, presignUpload } from '@/lib/r2';
import { createClient } from '@/lib/supabase/server';

export type PrepareUploadResult =
  { error: string } | { exists: true } | { uploadUrl: string; publicUrl: string; contentType: string };

const requestSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Enter a file name.')
    .max(512, 'That file name is too long.')
    .refine((key) => !key.startsWith('/') && !key.endsWith('/'), 'The name can’t start or end with a slash.')
    .refine((key) => !key.split('/').some((part) => part === '' || part === '.' || part === '..'), 'Invalid path.')
    .refine((key) => !/[\u0000-\u001f\u007f\\]/.test(key), 'The name has characters that can’t be used.'),
  contentType: z.string().max(255),
  overwrite: z.boolean(),
});

/**
 * Checks the name and hands back a presigned URL for the browser to upload
 * to. Refuses to replace an existing file unless asked: shipped app builds
 * link to these URLs.
 */
export async function prepareUpload(input: {
  key: string;
  contentType: string;
  overwrite: boolean;
}): Promise<PrepareUploadResult> {
  // The proxy gates this route, but a server action is a public POST endpoint,
  // and the URL it returns can write to the bucket.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Your session has expired. Sign in again.' };

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid upload.' };
  const { key, overwrite } = parsed.data;
  const contentType = parsed.data.contentType || 'application/octet-stream';

  try {
    if (!overwrite && (await mediaExists(key))) return { exists: true };
    return { uploadUrl: await presignUpload(key, contentType), publicUrl: mediaUrl(key), contentType };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Couldn’t reach the media bucket.' };
  }
}
