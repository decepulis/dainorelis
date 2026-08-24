/**
 * Fills in missing English titles and translations with OpenAI.
 *
 *   cd admin
 *   pnpm generate-metadata            # every song without a translation
 *   pnpm generate-metadata -- --limit 5   # first 5 candidates, a cheap dry run
 *   pnpm generate-metadata -- --force     # regenerate even where one exists
 *
 * This moved out of the app repo along with the rest of the CMS. It writes a
 * row into `translations` with `ai_generated` set — the same table the app
 * reads. (The Airtable version wrote to `EN Title` / `EN Translation` columns
 * on the Songs table, which the app never read; those were a dead end.)
 *
 * Generated translations are marked so the app can label them, and so a human
 * pass can find them later.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import OpenAI from 'openai';

import { createServiceClient } from '../src/lib/supabase/service';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MODEL = 'gpt-5.2';

/** Titles that are already English; a missing translation is expected. */
const ALREADY_TRANSLATED = ['JAV ', 'Kanados '];

function numberArg(name: string): number | undefined {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return undefined;
  const value = Number(process.argv[index + 1]);
  return Number.isFinite(value) ? value : undefined;
}

const limit = numberArg('limit');
const force = process.argv.includes('--force');

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set.');
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Metadata = { enTitle: string; enTranslation: string };

async function generateMetadata(songName: string, lyrics: string): Promise<Metadata> {
  const prompt = `
You are an expert in Lithuanian music, culture, and poetry analysis. Please analyze this Lithuanian song:

Title: ${songName}
Lyrics:
${lyrics}

Provide the following:
1. An English translation of the title

2. An English translation of the lyrics. Ignore markdown links when translating. Try to preserve the poetic elements like rhythm when possible, while ensuring the meaning is accurately conveyed. For idiomatic expressions or culturally-specific concepts, aim for the closest English equivalent that captures the intended meaning.

Format your response as JSON:
{
  "enTitle": "English translation of title here",
  "enTranslation": "English translation of lyrics here"
}
`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are an expert in Lithuanian music, culture, and poetry analysis.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned an empty response.');

  const parsed = JSON.parse(content) as Partial<Metadata>;
  if (!parsed.enTitle || !parsed.enTranslation) {
    throw new Error('OpenAI response was missing enTitle or enTranslation.');
  }

  return { enTitle: parsed.enTitle, enTranslation: parsed.enTranslation };
}

async function main() {
  const supabase = createServiceClient();

  console.log('🎵 Reading songs…');
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, name, lyrics(position, lyrics_and_chords), translations(id)')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);

  const candidates = (songs ?? []).filter((song) => {
    if (!force && song.translations.length > 0) return false;
    if (ALREADY_TRANSLATED.some((prefix) => song.name.startsWith(prefix))) return false;
    return song.lyrics.length > 0;
  });

  const selected = limit ? candidates.slice(0, limit) : candidates;

  console.log(`Found ${candidates.length} song(s) needing a translation; processing ${selected.length}.`);
  if (selected.length === 0) return;

  let succeeded = 0;
  let failed = 0;

  for (const [index, song] of selected.entries()) {
    // Translate the first lyrics variant; it is the canonical one in the app.
    const lyrics = [...song.lyrics].sort((a, b) => a.position - b.position)[0]?.lyrics_and_chords ?? '';
    if (!lyrics.trim()) {
      console.log(`  ⏭️  ${song.name} — lyrics are empty`);
      continue;
    }

    process.stdout.write(`  [${index + 1}/${selected.length}] ${song.name} … `);

    try {
      const metadata = await generateMetadata(song.name, lyrics);

      const { error: insertError } = await supabase.from('translations').insert({
        song_id: song.id,
        position: song.translations.length,
        title: metadata.enTitle,
        lyrics: metadata.enTranslation,
        ai_generated: true,
      });

      if (insertError) throw new Error(insertError.message);

      console.log('done');
      succeeded += 1;
    } catch (err) {
      console.log('failed');
      console.error(`      ${err instanceof Error ? err.message : err}`);
      failed += 1;
    }

    // Be gentle with the API.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log(`\n✅ ${succeeded} translated, ${failed} failed.`);
  console.log('ℹ️  Review them in the admin app, then run update-songs in the app repo.');
}

main().catch((error) => {
  console.error('❌ Metadata generation failed.', error);
  process.exit(1);
});
