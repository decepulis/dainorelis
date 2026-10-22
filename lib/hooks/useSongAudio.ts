import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Asset } from 'expo-asset';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { Audio } from '../schemas/audio';

const icon = Asset.fromModule(require('@/assets/images/icon.png'));
// The lock screen loads its artwork from a URL. In an Android release build the bundled icon's
// `uri` is a bare drawable name, which expo-audio can't cast to a URL (the throw crashed the song
// screen), and expo-asset marks it downloaded as is, so copy it to a cache file through a fresh
// Asset. Elsewhere `uri` is already a file:// or http URL.
const artworkUrl: Promise<string | undefined> = icon.uri.includes(':')
  ? Promise.resolve(icon.uri)
  : new Asset({ name: icon.name, type: icon.type, hash: icon.hash, uri: icon.uri })
      .downloadAsync()
      .then((asset) => asset.localUri ?? undefined)
      .catch(() => undefined);
// how long an iOS source may sit unloaded before play treats it as failed and reloads it (see below)
const iosStalledLoadMs = 4000;

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
    if (!activeMedia) return;
    const variantName = i18n.language === 'en' ? activeMedia['EN Variant Name'] : activeMedia['Variant Name'];
    let current = true;
    artworkUrl.then((url) => {
      if (current) player.setActiveForLockScreen(true, { title, artist: variantName, artworkUrl: url });
    });
    return () => {
      current = false;
    };
  }, [activeMedia, title, i18n.language, player]);

  // A failed load (e.g. no network) leaves the player stuck: expo-audio reports it as `status.error`,
  // but on Android an error raised before this hook subscribes never reaches `status`, and ExoPlayer
  // simply sits idle (it is otherwise only idle with no source). Play then does nothing, so reload
  // the source first.
  // (expo-audio prepares the source as it creates the player, so a player that hasn't failed is
  // buffering, ready or ended by the time its status reaches JS, never idle.)
  // On iOS the item's failure arrives as a single status event (often before this hook subscribes)
  // and the next update resets `error` to null, while AVPlayer keeps reporting buffering. So latch
  // the error, and treat a source still unloaded after a few seconds as possibly failed when play is
  // pressed. A slow first load is left alone, so pressing play again doesn't restart its download.
  // The setState calls during render below are deliberate: React's pattern for state derived from
  // the previous render's (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const [iosError, setIosError] = useState(false);
  if (process.env.EXPO_OS === 'ios' && status.error != null && !iosError) setIosError(true);
  if (iosError && status.isLoaded) setIosError(false);
  const failed =
    process.env.EXPO_OS === 'ios'
      ? iosError
      : status.error != null || (process.env.EXPO_OS === 'android' && status.playbackState === 'idle');
  // when the current source started loading: the player's creation, or the last reload
  const loadStartedAt = useRef(0);
  useEffect(() => {
    loadStartedAt.current = Date.now();
  }, [player]);
  // Set when the user presses play and cleared once playback starts, so a failure can be explained
  // to them. A screen that merely mounted offline never sets it, so it never alerts.
  const [playRequested, setPlayRequested] = useState(false);
  if (playRequested && status.playing) setPlayRequested(false);
  const togglePlaying = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    const iosStalled =
      process.env.EXPO_OS === 'ios' && !status.isLoaded && Date.now() - loadStartedAt.current > iosStalledLoadMs;
    if ((failed || iosStalled) && activeMedia) {
      setIosError(false);
      loadStartedAt.current = Date.now();
      player.replace(activeMedia.URL);
    }
    player.play();
    setPlayRequested(true);
  };

  // If the requested play sits failed (and not buffering) for a second, the load gave up. The grace
  // period is there because replace() passes through idle on Android; any status change restarts it.
  const settledFailed = failed && (process.env.EXPO_OS === 'ios' || !status.isBuffering);
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
