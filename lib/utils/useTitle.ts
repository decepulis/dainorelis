import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import { Song } from '../schemas/songs';

function splitTitle(title: string) {
  return title
    .split(/(.+?)(\([^\)]+\))$/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function useTitle(song: Song, activeVariant?: Lyrics | PDFs) {
  const { t } = useTranslation();
  return useMemo(() => {
    const [title, subtitle] = splitTitle(song.fields.Name as string);

    // toss on the variant name if there are multiple variants
    const variants = [...(song.fields.Lyrics || []), ...(song.fields.PDFs || [])];
    if (activeVariant && variants.length > 1) {
      let variantName = activeVariant['Variant Name'];
      variantName = variantName.replace('Žodžiai', t('lyrics'));
      variantName = variantName.replace('Natos', t('sheetMusic'));
      return { title, subtitle, variantName };
    }
    return { title, subtitle };
  }, [song.fields.Name, song.fields.Lyrics, song.fields.PDFs, activeVariant, t]);
}
