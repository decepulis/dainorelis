import { Lyrics } from '@/lib/schemas/lyrics';
import { PDFs } from '@/lib/schemas/pdfs';

const isLyrics = (variant: PDFs | Lyrics): variant is Lyrics => !!(variant as Lyrics)['Lyrics & Chords'];
export default isLyrics;
