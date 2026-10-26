import { useTranslation } from 'react-i18next';

import { useLocalSearchParams } from 'expo-router';

import NotFound from '@/lib/components/NotFound';
import ShareSheet from '@/lib/components/ShareSheet';
import { songUrl } from '@/lib/utils/songLink';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

/** The song's link as a QR code and for the system share sheet; ?v= is the variant to open it on */
export default function Page() {
  const { t, i18n } = useTranslation();
  const { id, v } = useLocalSearchParams<{ id: string; v?: string }>();
  const song = songs.find((song) => song.id === id);
  if (!song) {
    return <NotFound modal message={t('songNotFound')} />;
  }
  const variant = v ? (song.fields.Lyrics[v] ?? song.fields.PDFs[v]) : undefined;

  return (
    <ShareSheet
      url={songUrl(song.id, variant ? v : undefined)}
      title={song.fields.Name}
      subtitle={variant ? (i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name']) : undefined}
      hint={t('shareSongHint')}
    />
  );
}
