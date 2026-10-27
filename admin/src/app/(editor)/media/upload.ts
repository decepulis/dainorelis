import { prepareUpload } from './actions';

/**
 * The browser side of an upload to media.dainorelis.app, shared by the Media
 * page and the song editor's upload buttons.
 */

/** "Čiūto Tūto (alto).PDF" → "ciuto-tuto-alto.pdf": safe in a URL without encoding. */
export function suggestKey(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  const stem = dot > 0 ? fileName.slice(0, dot) : fileName;
  const extension = dot > 0 ? fileName.slice(dot).toLowerCase() : '';
  const slug = stem
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (slug || 'file') + extension;
}

/** fetch() can't report upload progress; XMLHttpRequest can. */
function put(url: string, file: File, contentType: string, onProgress: (fraction: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('PUT', url);
    request.setRequestHeader('Content-Type', contentType);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () =>
      request.status >= 200 && request.status < 300
        ? resolve()
        : reject(new Error(`The bucket answered ${request.status}.`));
    // A CORS rejection lands here with no detail; see admin/README.md.
    request.onerror = () => reject(new Error('The upload was blocked. Check the bucket’s CORS policy.'));
    request.send(file);
  });
}

/**
 * Uploads `file` as `key` and returns its public URL, or null if the editor
 * declined to replace an existing file. Throws with a message to show.
 */
export async function uploadMedia(
  file: File,
  key: string,
  onProgress: (fraction: number) => void
): Promise<string | null> {
  const contentType = file.type || 'application/octet-stream';
  let prepared = await prepareUpload({ key, contentType, overwrite: false });
  if ('exists' in prepared) {
    const replace = window.confirm(
      `${key} already exists. Replace it? Every song and app build that links to it will get the new file.`
    );
    if (!replace) return null;
    prepared = await prepareUpload({ key, contentType, overwrite: true });
  }
  if ('error' in prepared) throw new Error(prepared.error);
  if ('exists' in prepared) return null;

  await put(prepared.uploadUrl, file, prepared.contentType, onProgress);
  return prepared.publicUrl;
}
