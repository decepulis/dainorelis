'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { PRIMARY_BUTTON, TEXT_LINK } from '@/lib/styles';

import { prepareUpload } from './actions';
import CopyButton from './copy-button';

/** "Čiūto Tūto (alto).PDF" → "ciuto-tuto-alto.pdf": safe in a URL without encoding. */
function suggestKey(fileName: string): string {
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

type Status =
  | { state: 'idle' }
  | { state: 'uploading'; progress: number }
  | { state: 'error'; message: string }
  | { state: 'done'; url: string };

export default function Uploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [key, setKey] = useState('');
  const [status, setStatus] = useState<Status>({ state: 'idle' });

  async function upload(event: React.FormEvent) {
    event.preventDefault();
    if (!file) return;

    setStatus({ state: 'uploading', progress: 0 });
    const contentType = file.type || 'application/octet-stream';
    let prepared = await prepareUpload({ key, contentType, overwrite: false });
    if ('exists' in prepared) {
      const replace = window.confirm(
        `${key} already exists. Replace it? Every song and app build that links to it will get the new file.`
      );
      if (!replace) {
        setStatus({ state: 'idle' });
        return;
      }
      prepared = await prepareUpload({ key, contentType, overwrite: true });
    }
    if ('error' in prepared) {
      setStatus({ state: 'error', message: prepared.error });
      return;
    }
    if ('exists' in prepared) return;

    try {
      await put(prepared.uploadUrl, file, prepared.contentType, (progress) =>
        setStatus({ state: 'uploading', progress })
      );
    } catch (error) {
      setStatus({ state: 'error', message: error instanceof Error ? error.message : 'The upload failed.' });
      return;
    }
    setStatus({ state: 'done', url: prepared.publicUrl });
    setFile(null);
    setKey('');
    (event.target as HTMLFormElement).reset();
    router.refresh();
  }

  const uploading = status.state === 'uploading';

  return (
    <form onSubmit={upload} className="flex flex-col gap-4">
      <div>
        <label htmlFor="file">File</label>
        <input
          id="file"
          type="file"
          accept="application/pdf,audio/*,image/*"
          required
          disabled={uploading}
          onChange={(event) => {
            const picked = event.target.files?.[0] ?? null;
            setFile(picked);
            setKey(picked ? suggestKey(picked.name) : '');
            setStatus({ state: 'idle' });
          }}
        />
      </div>
      <div>
        <label htmlFor="key">Name in the bucket</label>
        <input
          id="key"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          required
          disabled={uploading}
          spellCheck={false}
          autoComplete="off"
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          The file’s URL. Lowercase with hyphens keeps it readable; it can’t be renamed later without breaking links.
        </p>
      </div>

      {status.state === 'error' ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {status.message}
        </p>
      ) : null}
      {status.state === 'uploading' ? (
        <progress value={status.progress} max={1} className="w-full" aria-label="Upload progress" />
      ) : null}
      {status.state === 'done' ? (
        <div role="status" className="flex items-center gap-3 text-sm">
          <span className="min-w-0 truncate">
            Uploaded:{' '}
            <a href={status.url} target="_blank" rel="noreferrer" className={TEXT_LINK}>
              {status.url}
            </a>
          </span>
          <CopyButton text={status.url} />
        </div>
      ) : null}

      <button type="submit" disabled={!file || uploading} className={PRIMARY_BUTTON}>
        {uploading ? `Uploading… ${Math.round(status.progress * 100)}%` : 'Upload'}
      </button>
    </form>
  );
}
