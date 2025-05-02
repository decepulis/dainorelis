import { Fragment, useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import WebView from 'react-native-webview';

import { FontAwesome6 } from '@expo/vector-icons';

import { DarkTheme } from '../constants/themes';
import { useThemeColor } from '../hooks/useThemeColor';
import { Audio } from '../schemas/audio';
import { Videos } from '../schemas/videos';
import ThemedText from './ThemedText';

const isAssetVideo = (asset: Audio | Videos): asset is Videos => !(asset as Audio).File;

export function usePlayerDimensions({ asset }: { asset: Audio | Videos }) {
  const { width } = useWindowDimensions();
  const isVideo = isAssetVideo(asset);
  if (isVideo) {
    const videoAspectRatio = 16 / 9;
    const videoWidth = Math.min(width, 320);
    const videoHeight = videoWidth / videoAspectRatio;

    return { width: videoWidth, height: videoHeight };
  } else {
    return { width, height: 60 };
  }
}

// TODO rebuild with expo-audio
function AudioPlayer({ asset, onClose }: { asset: Audio; onClose: () => void }) {
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const { width, height } = usePlayerDimensions({ asset });

  const [state, setState] = useState<'loading' | 'ready' | 'playing' | 'error'>('loading');

  const play = useCallback(() => {}, []);

  const pause = useCallback(() => {}, []);

  const restart = useCallback(() => {}, []);

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <View style={[{ borderColor: text, width, height }, styles.container, styles.audioContainer]}>
      {state === 'error' ? (
        // TODO error state
        <ThemedText>error</ThemedText>
      ) : state === 'loading' ? (
        // TODO loading state
        <ThemedText>loading...</ThemedText>
      ) : (
        <Fragment>
          {state === 'playing' ? (
            <Pressable hitSlop={24} onPress={pause}>
              <FontAwesome6 name="pause" size={24} color={primary} />
            </Pressable>
          ) : (
            <Pressable hitSlop={24} onPress={play}>
              <FontAwesome6 name="play" size={24} color={primary} />
            </Pressable>
          )}
          <Pressable hitSlop={24} onPress={restart}>
            <FontAwesome6 name="arrow-rotate-left" size={24} color={primary} />
          </Pressable>
        </Fragment>
      )}
      <Pressable hitSlop={24} onPress={close} style={styles.audioClose}>
        <FontAwesome6 name="xmark" size={24} color={primary} />
      </Pressable>
    </View>
  );
}

function VideoPlayer({ asset, onClose }: { asset: Videos; onClose: () => void }) {
  // TODO offline error
  // TODO no id error
  const text = useThemeColor('text');
  const { width, height } = usePlayerDimensions({ asset });
  const videoId = asset['YouTube Link'].split('?v=').pop();
  const embedUrl = `https://www.youtube.com/embed/${videoId}?playsinline=1`;

  return (
    <View style={[{ borderColor: text }, styles.container, styles.videoContainer]}>
      <View style={[styles.videoPlayer, { width, height }]}>
        {/* TODO html embed...? */}
        <WebView allowsAirPlayForMediaPlayback allowsInlineMediaPlayback source={{ uri: embedUrl }} />
      </View>
      <Pressable hitSlop={24} onPress={onClose} style={styles.videoClose}>
        <FontAwesome6 name="xmark" size={24} color="#fff" />
      </Pressable>
    </View>
  );
}

type Props = {
  asset: Audio | Videos;
  onClose: () => void;
};
export default function Player({ asset, onClose }: Props) {
  // TODO gesture to dismiss
  const isVideo = isAssetVideo(asset);
  return isVideo ? <VideoPlayer asset={asset} onClose={onClose} /> : <AudioPlayer asset={asset} onClose={onClose} />;
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  audioContainer: {
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 25,
  },
  audioClose: {
    marginLeft: 'auto',
  },
  videoContainer: {
    backgroundColor: DarkTheme.colors.background,
  },
  videoPlayer: {
    marginHorizontal: 'auto',
    backgroundColor: 'black',
  },
  videoClose: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
