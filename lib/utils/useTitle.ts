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
  const { i18n } = useTranslation();
  return useMemo(() => {
    const [title, subtitle] = splitTitle(song.fields.Name as string);

    const variants = { ...song.fields.Lyrics, ...song.fields.PDFs };
    if (activeVariant && Object.keys(variants).length > 1) {
      let variantName = i18n.language === 'en' ? activeVariant['EN Variant Name'] : activeVariant['Variant Name'];
      return { title, subtitle, variantName };
    }
    return { title, subtitle };
  }, [activeVariant, i18n.language, song.fields.Lyrics, song.fields.Name, song.fields.PDFs]);
}
