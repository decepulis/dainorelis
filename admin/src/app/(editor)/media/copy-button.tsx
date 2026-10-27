'use client';

import { useState } from 'react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-md border border-stone-300 px-2 py-0.5 text-xs hover:bg-stone-100 dark:border-stone-700
        dark:hover:bg-stone-900"
    >
      {copied ? 'Copied' : 'Copy URL'}
    </button>
  );
}
