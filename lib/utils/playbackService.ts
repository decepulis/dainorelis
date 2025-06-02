import TrackPlayer, { Event } from 'react-native-track-player';

export default async function playbackService() {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
  TrackPlayer.addEventListener(Event.RemoteJumpForward, ({ interval }) => TrackPlayer.seekBy(interval));
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, ({ interval }) => TrackPlayer.seekBy(-interval));
}
