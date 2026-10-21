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

  return { player, status };
}

export type SongAudio = ReturnType<typeof useSongAudio>;
