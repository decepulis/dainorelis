'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

type CountRelation = { count: number }[];

type SongSummary = {
  id: string;
  name: string;
  hide: boolean;
  lyrics: CountRelation;
  translations: CountRelation;
  audio: CountRelation;
  pdfs: CountRelation;
};

function count(relation: CountRelation): number {
  return relation[0]?.count ?? 0;
}

/** Diacritic-insensitive so "ciuto" finds "Čiūto". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export default function SongList({ songs }: { songs: SongSummary[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());
    if (!needle) return songs;
    return songs.filter((song) => normalize(song.name).includes(needle));
  }, [songs, query]);

  return (
    <>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by title…"
        aria-label="Filter songs by title"
        className="mb-4"
      />

      <ul className="divide-y divide-stone-200 dark:divide-stone-800">
        {filtered.map((song) => (
          <li key={song.id}>
            <Link
              href={`/songs/${song.id}`}
              className="flex items-baseline gap-3 py-2.5 hover:bg-stone-100 dark:hover:bg-stone-900"
            >
              <span className="font-medium">{song.name}</span>
              {song.hide ? (
                <span
                  className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800
                    dark:bg-amber-950 dark:text-amber-300"
                >
                  hidden
                </span>
              ) : null}
              <span className="ml-auto shrink-0 text-xs text-stone-500 dark:text-stone-400">
                {count(song.lyrics)} lyrics · {count(song.translations)} tr · {count(song.audio)} audio ·{' '}
                {count(song.pdfs)} pdf
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500 dark:text-stone-400">No songs match “{query}”.</p>
      ) : null}
    </>
  );
}
