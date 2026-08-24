'use client';

import { useActionState } from 'react';

import Link from 'next/link';

import { type EditorState, deleteSong, saveSong } from '../../actions';
import { type FieldSpec, SECTIONS, type SectionSpec } from './fields';

type ChildRecord = { id: string; position: number } & Record<string, unknown>;

type Song = {
  id: string;
  name: string;
  tags: string[] | null;
  sources: string[] | null;
  recommended_key: string | null;
  music_author: string | null;
  text_author: string | null;
  lt_description: string | null;
  en_description: string | null;
  hide: boolean;
  lyrics: ChildRecord[];
  translations: ChildRecord[];
  audio: ChildRecord[];
  pdfs: ChildRecord[];
  videos: ChildRecord[];
};

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Secondary button; used for every structural change in the form. */
const SUBTLE_BUTTON =
  'rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 ' +
  'disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800';

function ChildField({ table, record, field }: { table: string; record: ChildRecord; field: FieldSpec }) {
  const name = `${table}:${record.id}:${field.column}`;
  const inputId = name.replace(/:/g, '-');
  const value = record[field.column];

  if (field.kind === 'checkbox') {
    return (
      <label htmlFor={inputId} className="flex items-center gap-2 normal-case">
        <input id={inputId} name={name} type="checkbox" defaultChecked={value === true} className="size-4 w-auto" />
        <span className="text-xs font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">
          {field.label}
        </span>
      </label>
    );
  }

  return (
    <div className={field.wide ? 'sm:col-span-2' : undefined}>
      <label htmlFor={inputId}>{field.label}</label>
      {field.kind === 'textarea' ? (
        <textarea id={inputId} name={name} rows={field.column === 'notes' ? 2 : 12} defaultValue={text(value)} />
      ) : (
        <input id={inputId} name={name} type={field.kind === 'url' ? 'url' : 'text'} defaultValue={text(value)} />
      )}
      {field.hint ? <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{field.hint}</p> : null}
    </div>
  );
}

function Section({ section, records }: { section: SectionSpec; records: ChildRecord[] }) {
  const sorted = [...records].sort((a, b) => a.position - b.position);
  const unnamed = sorted.filter((record) => !text(record.variant_name)).length;

  return (
    <section className="border-t border-stone-200 pt-6 dark:border-stone-800">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">{section.title}</h2>
        <span className="text-xs text-stone-500 dark:text-stone-400">{sorted.length}</span>
        <button type="submit" name="intent" value={`add:${section.table}`} className={`${SUBTLE_BUTTON} ml-auto`}>
          {section.addLabel}
        </button>
      </div>

      {sorted.length === 0 ? <p className="text-sm text-stone-500 dark:text-stone-400">None yet.</p> : null}

      <div className="flex flex-col gap-4">
        {sorted.map((record, index) => (
          <fieldset key={record.id} className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
            <legend className="px-1 text-xs text-stone-500 dark:text-stone-400">
              {text(record.variant_name) || `${section.defaultName}${unnamed > 1 ? ` ${index + 1}` : ''} (auto)`}
            </legend>

            <div className="grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <ChildField key={field.column} table={section.table} record={record} field={field} />
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="submit"
                name="intent"
                value={`up:${section.table}:${record.id}`}
                disabled={index === 0}
                className={SUBTLE_BUTTON}
              >
                ↑ Move up
              </button>
              <button
                type="submit"
                name="intent"
                value={`down:${section.table}:${record.id}`}
                disabled={index === sorted.length - 1}
                className={SUBTLE_BUTTON}
              >
                ↓ Move down
              </button>
              <button
                type="submit"
                name="intent"
                value={`delete:${section.table}:${record.id}`}
                className={`${SUBTLE_BUTTON} ml-auto text-red-600 dark:text-red-400`}
              >
                Delete
              </button>
            </div>
          </fieldset>
        ))}
      </div>
    </section>
  );
}

export default function SongEditor({ song }: { song: Song }) {
  const [state, formAction, pending] = useActionState<EditorState, FormData>(saveSong, {});

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link href="/" className="text-sm text-stone-500 hover:underline dark:text-stone-400">
        ← All songs
      </Link>

      {/*
        `key` remounts the form after a save so every field picks up the fresh
        server values — including ids of records that were just added.
      */}
      <form action={formAction} key={state.savedAt ?? 'initial'} className="mt-4 flex flex-col gap-6">
        <input type="hidden" name="songId" value={song.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name">Title</label>
            <input id="name" name="name" defaultValue={song.name} required />
          </div>

          <div>
            <label htmlFor="music_author">Music author</label>
            <input id="music_author" name="music_author" defaultValue={song.music_author ?? ''} />
          </div>
          <div>
            <label htmlFor="text_author">Text author</label>
            <input id="text_author" name="text_author" defaultValue={song.text_author ?? ''} />
          </div>

          <div>
            <label htmlFor="recommended_key">Recommended key</label>
            <input id="recommended_key" name="recommended_key" defaultValue={song.recommended_key ?? ''} />
          </div>
          <div>
            <label htmlFor="tags">Tags</label>
            <input id="tags" name="tags" defaultValue={(song.tags ?? []).join(', ')} />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Comma separated.</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sources">Sources</label>
            <input id="sources" name="sources" defaultValue={(song.sources ?? []).join(', ')} />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Comma separated.</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="lt_description">Description (LT)</label>
            <textarea id="lt_description" name="lt_description" rows={4} defaultValue={song.lt_description ?? ''} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="en_description">Description (EN)</label>
            <textarea id="en_description" name="en_description" rows={4} defaultValue={song.en_description ?? ''} />
          </div>

          <label htmlFor="hide" className="flex items-center gap-2 normal-case sm:col-span-2">
            <input id="hide" name="hide" type="checkbox" defaultChecked={song.hide} className="size-4 w-auto" />
            <span className="text-xs font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">
              Hide from the app
            </span>
          </label>
        </div>

        {SECTIONS.map((section) => (
          <Section key={section.table} section={section} records={song[section.table]} />
        ))}

        {state.error ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {state.error}
          </p>
        ) : null}

        <div
          className="sticky bottom-0 flex items-center gap-3 border-t border-stone-200 bg-stone-50/90
            py-3 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90"
        >
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={pending}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white
              hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900
              dark:hover:bg-stone-300"
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
          {state.savedAt && !state.error ? (
            <span className="text-sm text-stone-500 dark:text-stone-400">Saved.</span>
          ) : null}
          <span className="ml-auto font-mono text-xs text-stone-400 dark:text-stone-600">{song.id}</span>
        </div>
      </form>

      <form action={deleteSong} className="mt-10 border-t border-stone-200 pt-6 dark:border-stone-800">
        <input type="hidden" name="songId" value={song.id} />
        <button type="submit" className="text-sm text-red-600 hover:underline dark:text-red-400">
          Delete this song
        </button>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Deletes the song and every variant attached to it. To keep it out of the app without losing it, use “Hide from
          the app” instead.
        </p>
      </form>
    </main>
  );
}
