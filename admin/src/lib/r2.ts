import { HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * The Cloudflare R2 bucket behind media.dainorelis.app (sheet music PDFs and
 * audio). Server-only: the keys can write to the bucket.
 */

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Where the bucket is served publicly; songs' `url` fields point here. */
export const MEDIA_BASE_URL = 'https://media.dainorelis.app';

const bucket = () => required('R2_BUCKET', process.env.R2_BUCKET);

function client() {
  const accountId = required('R2_ACCOUNT_ID', process.env.R2_ACCOUNT_ID);
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: required('R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID),
      secretAccessKey: required('R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY),
    },
    // The SDK otherwise signs a checksum of the (empty) body into presigned
    // URLs, and the browser's upload then fails to match it.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET
  );
}

/** The public URL for a key, encoded the way the existing song URLs are (spaces as %20). */
export function mediaUrl(key: string): string {
  return `${MEDIA_BASE_URL}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

export type MediaObject = { key: string; size: number; lastModified: string | null };

/** Every object in the bucket, newest first. */
export async function listMedia(): Promise<MediaObject[]> {
  const s3 = client();
  const objects: MediaObject[] = [];
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket(), ContinuationToken: token }));
    for (const object of page.Contents ?? []) {
      if (!object.Key) continue;
      objects.push({
        key: object.Key,
        size: object.Size ?? 0,
        lastModified: object.LastModified?.toISOString() ?? null,
      });
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return objects.sort((a, b) => (b.lastModified ?? '').localeCompare(a.lastModified ?? ''));
}

export async function mediaExists(key: string): Promise<boolean> {
  try {
    await client().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch (error) {
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) return false;
    throw error;
  }
}

/**
 * A URL the browser PUTs the file to directly. Vercel functions take at most
 * 4.5 MB of request body, so uploads can't go through the admin's own server.
 * R2 stores the Content-Type header the upload sends.
 */
export async function presignUpload(key: string, contentType: string): Promise<string> {
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType }), {
    expiresIn: 15 * 60,
  });
}
