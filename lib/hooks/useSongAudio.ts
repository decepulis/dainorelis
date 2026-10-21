import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Asset } from 'expo-asset';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { Audio } from '../schemas/audio';

const artworkUrl = Asset.fromModule(require('@/assets/images/icon.png')).uri;

/**
 * The song screen's audio player and lock screen controls. Kept in the screen rather than in
 * Player, so the controls can move (into the native bottom toolbar on Liquid Glass) or remount
 * without restarting playback.
 */
export default function useSongAudio(title: string, activeMedia: Audio | null) {
  const { i18n } = useTranslation();
  const player = useAudioPlayer(activeMedia?.URL ?? null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (activeMedia) {
      const variantName = i18n.language === 'en' ? activeMedia['EN Variant Name'] : activeMedia['Variant Name'];
      player.setActiveForLockScreen(true, { title, artist: variantName, artworkUrl });
    }
  }, [activeMedia, title, i18n.language, player]);

  // A failed load (e.g. no network) leaves the player stuck: expo-audio reports it as `status.error`,
  // but on Android an error raised before this hook subscribes never reaches `status`, and ExoPlayer
  // simply sits idle (it is otherwise only idle with no source). Play then does nothing, so reload
  // the source first.
  const failed = status.error != null || (process.env.EXPO_OS === 'android' && status.playbackState === 'idle');
  const togglePlaying = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (failed && activeMedia) player.replace(activeMedia.URL);
    player.play();
  };

  return { player, status, failed, loading: status.isBuffering && !failed, togglePlaying };
}

export type SongAudio = ReturnType<typeof useSongAudio>;
