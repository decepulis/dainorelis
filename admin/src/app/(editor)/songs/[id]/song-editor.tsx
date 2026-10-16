'use client';

import { useActionState, useRef } from 'react';

import Link from 'next/link';

import { type EditorState, deleteSong, saveSong } from '../../actions';
import SubmitButton from '../../submit-button';
import { type FieldSpec, SECTIONS, type SectionSpec } from './fields';

type ChildRecord = { id: string; position: number } & Record<string, unknown>;

/** The submitted fields after a failed save; see `EditorState.values`. */
type Draft = Record<string, string> | undefined;

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

/** `table:id` for a variant's field name (`table:id:column`), or null for a song field. */
function recordKey(name: string): string | null {
  const parts = name.split(':');
  return parts.length === 3 ? `${parts[0]}:${parts[1]}` : null;
}

/**
 * Leaves the variants nobody touched out of the submission, so a save writes
 * only what changed. Otherwise every save rewrote every variant, bumping each
 * `updated_at` and reverting whatever another editor had saved to a variant
 * this one never opened. A touched variant goes in whole, since the server
 * reads an absent checkbox as unchecked.
 */
function dropUntouchedRecords(form: HTMLFormElement, formData: FormData) {
  const touched = new Set<string>();
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) continue;
    const key = recordKey(element.name);
    if (!key) continue;

    const changed =
      element instanceof HTMLInputElement && element.type === 'checkbox'
        ? element.checked !== element.defaultChecked
        : element.value !== element.defaultValue;
    if (changed) touched.add(key);
  }

  for (const name of Array.from(formData.keys())) {
    const key = recordKey(name);
    if (key && !touched.has(key)) formData.delete(name);
  }
}

/** Secondary button; used for every structural change in the form. */
const SUBTLE_BUTTON =
  'rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-600 hover:bg-stone-100 ' +
  'disabled:opacity-40 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800';

function ChildField({
  table,
  record,
  field,
  draft,
}: {
  table: string;
  record: ChildRecord;
  field: FieldSpec;
  draft: Draft;
}) {
  const name = `${table}:${record.id}:${field.column}`;
  const inputId = name.replace(/:/g, '-');
  const value = record[field.column];

  if (field.kind === 'checkbox') {
    // A variant left untouched wasn't submitted, so the draft says nothing
    // about it; an absent checkbox only means "unchecked" for one that was.
    const prefix = `${table}:${record.id}:`;
    const submitted = draft !== undefined && Object.keys(draft).some((key) => key.startsWith(prefix));

    return (
      <label htmlFor={inputId} className="flex items-center gap-2 normal-case">
        <input
          id={inputId}
          name={name}
          type="checkbox"
          defaultChecked={submitted ? name in draft : value === true}
          className="size-4 w-auto"
        />
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
        <textarea
          id={inputId}
          name={name}
          rows={field.column === 'notes' ? 2 : 12}
          defaultValue={draft?.[name] ?? text(value)}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={field.kind === 'url' ? 'url' : 'text'}
          defaultValue={draft?.[name] ?? text(value)}
        />
      )}
      {field.hint ? <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{field.hint}</p> : null}
    </div>
  );
}

function Section({
  section,
  records,
  draft,
  pending,
}: {
  section: SectionSpec;
  records: ChildRecord[];
  draft: Draft;
  /** A save is in flight; a second click would add or delete twice. */
  pending: boolean;
}) {
  const sorted = [...records].sort((a, b) => a.position - b.position);
  const unnamed = sorted.filter((record) => !text(record.variant_name)).length;

  return (
    <section className="border-t border-stone-200 pt-6 dark:border-stone-800">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">{section.title}</h2>
        <span className="text-xs text-stone-500 dark:text-stone-400">{sorted.length}</span>
        <button
          type="submit"
          name="intent"
          value={`add:${section.table}`}
          disabled={pending}
          className={`${SUBTLE_BUTTON} ml-auto`}
        >
          {section.addLabel}
        </button>
      </div>

      {sorted.length === 0 ? <p className="text-sm text-stone-500 dark:text-stone-400">None yet.</p> : null}

      <div className="flex flex-col gap-4">
        {sorted.map((record, index) => {
          const label =
            text(record.variant_name) || `${section.defaultName}${unnamed > 1 ? ` ${index + 1}` : ''} (auto)`;

          return (
            <fieldset key={record.id} className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
              <legend className="px-1 text-xs text-stone-500 dark:text-stone-400">{label}</legend>

              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <ChildField key={field.column} table={section.table} record={record} field={field} draft={draft} />
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="submit"
                  name="intent"
                  value={`up:${section.table}:${record.id}`}
                  disabled={pending || index === 0}
                  className={SUBTLE_BUTTON}
                >
                  ↑ Move up
                </button>
                <button
                  type="submit"
                  name="intent"
                  value={`down:${section.table}:${record.id}`}
                  disabled={pending || index === sorted.length - 1}
                  className={SUBTLE_BUTTON}
                >
                  ↓ Move down
                </button>
                <button
                  type="submit"
                  name="intent"
                  value={`delete:${section.table}:${record.id}`}
                  disabled={pending}
                  // An imported link the browser considers malformed would
                  // otherwise block deleting the very row that holds it.
                  formNoValidate
                  onClick={(event) => {
                    if (!window.confirm(`Delete “${label}” from ${section.title}? This cannot be undone.`)) {
                      event.preventDefault();
                    }
                  }}
                  className={`${SUBTLE_BUTTON} ml-auto text-red-600 dark:text-red-400`}
                >
                  Delete
                </button>
              </div>
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}

export default function SongEditor({ song }: { song: Song }) {
  const [state, formAction, pending] = useActionState<EditorState, FormData>(saveSong, {});
  // After a failed save, show what was submitted rather than what is stored.
  const draft = state.values;
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    // After a failed save the fields' defaults are the draft, not what is
    // stored, so "unchanged" can't be told from the DOM; send everything.
    if (!draft && formRef.current) dropUntouchedRecords(formRef.current, formData);
    formAction(formData);
  }

  return (
    <main className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <Link href="/" className="text-sm text-stone-500 hover:underline dark:text-stone-400">
        ← All songs
      </Link>

      {/*
        `key` remounts the form after a save so every field picks up the fresh
        server values — including ids of records that were just added. A failed
        save keeps the key, and the fields fall back to `draft`.
      */}
      <form ref={formRef} action={submit} key={state.savedAt ?? 'initial'} className="mt-4 flex flex-col gap-6">
        <input type="hidden" name="songId" value={song.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name">Title</label>
            <input id="name" name="name" defaultValue={draft?.name ?? song.name} required />
          </div>

          <div>
            <label htmlFor="music_author">Music author</label>
            <input
              id="music_author"
              name="music_author"
              defaultValue={draft?.music_author ?? song.music_author ?? ''}
            />
          </div>
          <div>
            <label htmlFor="text_author">Text author</label>
            <input id="text_author" name="text_author" defaultValue={draft?.text_author ?? song.text_author ?? ''} />
          </div>

          <div>
            <label htmlFor="recommended_key">Recommended key</label>
            <input
              id="recommended_key"
              name="recommended_key"
              defaultValue={draft?.recommended_key ?? song.recommended_key ?? ''}
            />
          </div>
          <div>
            <label htmlFor="tags">Tags</label>
            <input id="tags" name="tags" defaultValue={draft?.tags ?? (song.tags ?? []).join(', ')} />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Comma separated.</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sources">Sources</label>
            <input id="sources" name="sources" defaultValue={draft?.sources ?? (song.sources ?? []).join(', ')} />
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Comma separated.</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="lt_description">Description (LT)</label>
            <textarea
              id="lt_description"
              name="lt_description"
              rows={4}
              defaultValue={draft?.lt_description ?? song.lt_description ?? ''}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="en_description">Description (EN)</label>
            <textarea
              id="en_description"
              name="en_description"
              rows={4}
              defaultValue={draft?.en_description ?? song.en_description ?? ''}
            />
          </div>

          <label htmlFor="hide" className="flex items-center gap-2 normal-case sm:col-span-2">
            <input
              id="hide"
              name="hide"
              type="checkbox"
              defaultChecked={draft ? 'hide' in draft : song.hide}
              className="size-4 w-auto"
            />
            <span className="text-xs font-medium tracking-wide text-stone-500 uppercase dark:text-stone-400">
              Hide from the app
            </span>
          </label>
        </div>

        {SECTIONS.map((section) => (
          <Section
            key={section.table}
            section={section}
            records={song[section.table]}
            draft={draft}
            pending={pending}
          />
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
        <SubmitButton
          // The delete cascades to every variant and cannot be undone.
          onClick={(event) => {
            if (!window.confirm(`Delete “${song.name}” and every variant attached to it? This cannot be undone.`)) {
              event.preventDefault();
            }
          }}
          pendingLabel="Deleting…"
          className="text-sm text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
        >
          Delete this song
        </SubmitButton>
        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
          Deletes the song and every variant attached to it. To keep it out of the app without losing it, use “Hide from
          the app” instead.
        </p>
      </form>
    </main>
  );
}
