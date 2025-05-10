import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import { Song } from '../schemas/songs';

function splitTitle(title: string) {
  return title
    .split(/(\(.*\))/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export default function getTitle(song: Song, variants: (Lyrics | PDFs)[], activeVariant: Lyrics | PDFs) {
  const titleParts = splitTitle(song.fields.Name as string);
  let _titlePartsWithVariant = [...titleParts];
  if (variants.length > 1) {
    _titlePartsWithVariant.push(activeVariant['Variant Name']);
  }
  return _titlePartsWithVariant;
}
