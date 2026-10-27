'use client';

import { useRef, useState } from 'react';

import { suggestKey, uploadMedia } from '../../media/upload';

/**
 * Uploads a file to media.dainorelis.app and writes its URL into the URL
 * field beside it. The field stays editable, so a link out (Spotify, YouTube)
 * works as well; the upload only lands with the song's next save.
 */
export default function UploadButton({
  accept,
  onUploaded,
  className,
}: {
  accept: string;
  /** Fills in the URL field. */
  onUploaded: (url: string) => void;
  className: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function upload(file: File) {
    const key = window.prompt('Name in the bucket (this becomes the URL):', suggestKey(file.name))?.trim();
    if (!key) return;

    setMessage(null);
    setProgress(0);
    try {
      const url = await uploadMedia(file, key, setProgress);
      if (url) {
        onUploaded(url);
        setMessage({ error: false, text: 'Uploaded. Save the song to keep the link.' });
      }
    } catch (error) {
      setMessage({ error: true, text: error instanceof Error ? error.message : 'The upload failed.' });
    } finally {
      setProgress(null);
    }
  }

  return (
    <>
      {/* No name, so it's never part of the song's form submission. */}
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) upload(file);
        }}
      />
      <button
        type="button"
        disabled={progress !== null}
        onClick={() => fileRef.current?.click()}
        className={`${className} shrink-0`}
      >
        {progress === null ? 'Upload…' : `${Math.round(progress * 100)}%`}
      </button>
      {message ? (
        <p
          role={message.error ? 'alert' : 'status'}
          className={`basis-full text-xs ${message.error ? 'text-red-600 dark:text-red-400' : 'text-stone-600 dark:text-stone-300'}`}
        >
          {message.text}
        </p>
      ) : null}
    </>
  );
}
