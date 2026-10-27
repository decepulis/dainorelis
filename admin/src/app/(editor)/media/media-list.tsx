'use client';

import { useMemo, useState } from 'react';

import CopyButton from './copy-button';

type Item = { key: string; url: string; size: number; lastModified: string | null };

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MediaList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) => item.key.toLowerCase().includes(needle));
  }, [items, query]);

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by name…"
        aria-label="Filter files by name"
        className="mb-4"
      />

      <ul className="divide-y divide-stone-200 text-sm dark:divide-stone-800">
        {filtered.map((item) => (
          <li key={item.key} className="flex items-center gap-3 py-2">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate underline-offset-2 hover:underline"
            >
              {item.key}
            </a>
            <span className="ml-auto shrink-0 text-xs text-stone-500 tabular-nums dark:text-stone-400">
              {formatSize(item.size)}
              {item.lastModified ? ` · ${item.lastModified.slice(0, 10)}` : null}
            </span>
            <CopyButton text={item.url} />
          </li>
        ))}
      </ul>
      {filtered.length === 0 ? (
        <p className="py-4 text-sm text-stone-500 dark:text-stone-400">No files match.</p>
      ) : null}
    </>
  );
}
