/**
 * How the export names a variant that has no name of its own. Shared by the
 * export transform and the editor, which labels each unnamed variant with the
 * name the app will show for it.
 */
import type { ChildTable } from '../supabase/types';

/** What an unnamed variant of each kind is called, in the app's two languages. */
export const DEFAULT_VARIANT_NAMES: Record<ChildTable, { lt: string; en: string }> = {
  lyrics: { lt: 'Žodžiai', en: 'Lyrics' },
  translations: { lt: 'Vertimas', en: 'Translation' },
  audio: { lt: 'Įrašas', en: 'Recording' },
  pdfs: { lt: 'Natos', en: 'Score' },
  videos: { lt: 'Įrašas', en: 'Recording' },
};

type NamedRecord = { position: number; variant_name: string | null; en_variant_name: string | null };

export function byPosition<T extends NamedRecord>(records: T[] | null | undefined): T[] {
  return [...(records ?? [])].sort((a, b) => a.position - b.position);
}

/**
 * When `Variant Name` is not defined, we default to `${defaultName} ${idx + 1}`
 * When `EN Variant Name` is not defined, we default to `Variant Name`
 *
 * Two details are deliberate:
 *
 *  - The index suffix is only appended when MORE THAN ONE record is missing a
 *    name. A lone unnamed variant is just "Žodžiai", not "Žodžiai 1".
 *  - `idx` is the record's position among ALL of the song's records, not among
 *    the unnamed ones. So a song whose 1st and 3rd variants are unnamed yields
 *    "Žodžiai 1" and "Žodžiai 3". This is what Airtable produced, and the
 *    numbers are user-visible in the app, so the gap is preserved.
 *
 * `records` must already be in position order (see `byPosition`).
 */
export function assignVariantNames<T extends NamedRecord>(
  records: T[],
  table: ChildTable
): (T & { ltName: string; enName: string })[] {
  const { lt: defaultLtName, en: defaultEnName } = DEFAULT_VARIANT_NAMES[table];
  const numberOfMissingVariantNames = records.filter((record) => !record.variant_name).length;
  const shouldAppendIndexNumber = numberOfMissingVariantNames > 1;

  return records.map((record, idx) => {
    const alreadyHasName = !!record.variant_name;
    let ltName = alreadyHasName ? record.variant_name! : defaultLtName;
    let enName = alreadyHasName ? (record.en_variant_name ?? record.variant_name!) : defaultEnName;
    if (shouldAppendIndexNumber && !alreadyHasName) {
      ltName += ` ${idx + 1}`;
      enName += ` ${idx + 1}`;
    }
    return { ...record, ltName, enName };
  });
}
