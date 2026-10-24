import { useTranslation } from 'react-i18next';

import { useLocalSearchParams } from 'expo-router';

import NotFound from '@/lib/components/NotFound';
import ShareSheet from '@/lib/components/ShareSheet';
import { pluralKey } from '@/lib/constants/i18n';
import usePlaylists from '@/lib/hooks/usePlaylists';
import { playlistUrl } from '@/lib/utils/playlistLink';

/** The playlist's link as a QR code and for the system share sheet */
export default function Page() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlaylist } = usePlaylists();
  const playlist = getPlaylist(id);
  if (!playlist) {
    return <NotFound modal message={t('pageNotFound')} />;
  }

  return (
    <ShareSheet
      // a QR code holds a link to ~190 songs; past that, the link alone
      url={playlistUrl(playlist.name, playlist.songIds)}
      title={playlist.name}
      subtitle={t(pluralKey('songCount', playlist.songIds.length, i18n.language), { n: playlist.songIds.length })}
      hint={t('sharePlaylistHint')}
      tooLongHint={t('playlistTooLongForQRCode')}
    />
  );
}
