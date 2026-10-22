import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

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
  const { t, i18n } = useTranslation();
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
  // Set when the user presses play and cleared once playback starts, so a failure can be explained
  // to them. A screen that merely mounted offline never sets it, so it never alerts.
  const [playRequested, setPlayRequested] = useState(false);
  if (playRequested && status.playing) setPlayRequested(false);
  const togglePlaying = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (failed && activeMedia) player.replace(activeMedia.URL);
    player.play();
    setPlayRequested(true);
  };

  // If the requested play sits failed (and not buffering) for a second, the load gave up. The grace
  // period is there because replace() passes through idle on Android; any status change restarts it.
  const settledFailed = failed && !status.isBuffering;
  useEffect(() => {
    if (!playRequested || !settledFailed) return;
    const timeout = setTimeout(() => {
      setPlayRequested(false);
      Alert.alert(t('playbackFailedTitle'), t('playbackFailedMessage'));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [playRequested, settledFailed, t]);

  return { player, status, failed, loading: status.isBuffering && !failed, togglePlaying };
}

export type SongAudio = ReturnType<typeof useSongAudio>;
