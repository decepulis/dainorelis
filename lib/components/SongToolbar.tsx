import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Stack } from 'expo-router';

import { BottomSheet, Button, HStack, Host, Picker, Slider, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  labelStyle,
  monospacedDigit,
  padding,
  pickerStyle,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';

import type { SongAudio } from '../hooks/useSongAudio';
import { useThemeColor } from '../hooks/useThemeColor';
import { Audio } from '../schemas/audio';

const skipSeconds = 10;

type Props = {
  title: string;
  media: { [id: string]: Audio };
  activeMediaId: string | undefined;
  setActiveMediaId: (id: string) => void;
  audio: SongAudio;
};

const formatTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * The song screen's player controls as native toolbar items, so UIKit
 * places them (the trailing corner on a phone, the vertical bar on a closed iPhone Duo): play/pause
 * and an info button for a sheet with the full player. The variant menu is in the title.
 */
export default function SongToolbar({ title, media, activeMediaId, setActiveMediaId, audio }: Props) {
  const { t, i18n } = useTranslation();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const name = (item: Audio) => (i18n.language === 'en' ? item['EN Variant Name'] : item['Variant Name']);

  const activeMedia = activeMediaId ? media[activeMediaId] : undefined;
  const { player, status } = audio;
  // the classic (pre-iOS 26) toolbar would tint everything system blue; Liquid Glass uses the label color
  const primary = useThemeColor('primary');
  const tintColor = isLiquidGlassAvailable() ? undefined : primary;
  const togglePlaying = () => (status.playing ? player.pause() : player.play());

  if (!activeMedia) return null;

  return (
    <>
      <Stack.Toolbar placement="bottom">
        <Stack.Toolbar.Spacer />
        {activeMedia ? (
          // the title is the accessibility label; icon items show only the icon
          <Stack.Toolbar.Button icon="info" tintColor={tintColor} onPress={() => setIsSheetOpen(true)}>
            {t('showPlayerDetails')}
          </Stack.Toolbar.Button>
        ) : null}
        {activeMedia ? (
          // play/pause in the trailing corner, under the thumb
          <Stack.Toolbar.Button
            icon={status.playing ? 'pause.fill' : 'play.fill'}
            tintColor={tintColor}
            onPress={togglePlaying}
          >
            {status.playing ? t('pause') : t('play')}
          </Stack.Toolbar.Button>
        ) : null}
      </Stack.Toolbar>
      {activeMedia ? (
        <PlayerSheet
          title={title}
          media={media}
          activeMediaId={activeMediaId!}
          setActiveMediaId={setActiveMediaId}
          name={name}
          audio={audio}
          isOpen={isSheetOpen}
          setIsOpen={setIsSheetOpen}
          togglePlaying={togglePlaying}
        />
      ) : null}
    </>
  );
}

type PlayerSheetProps = {
  title: string;
  media: { [id: string]: Audio };
  activeMediaId: string;
  setActiveMediaId: (id: string) => void;
  name: (item: Audio) => string;
  audio: SongAudio;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  togglePlaying: () => void;
};

/** The full player: a native sheet sized to its content */
function PlayerSheet({
  title,
  media,
  activeMediaId,
  setActiveMediaId,
  name,
  audio,
  isOpen,
  setIsOpen,
  togglePlaying,
}: PlayerSheetProps) {
  const { t } = useTranslation();
  const inset = useSafeAreaInsets();
  const primary = useThemeColor('primary');
  const { player, status } = audio;
  const duration = status.duration || 0;

  // While dragging, show the drag position. After a seek, keep showing its target until playback
  // catches up, so the playhead doesn't jump back to the old time and then forward again.
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);
  if (seekTarget !== null && Math.abs(status.currentTime - seekTarget) < 1) {
    // caught up: adjusting state while rendering (https://react.dev/learn/you-might-not-need-an-effect)
    setSeekTarget(null);
  }
  const time = scrubTime ?? seekTarget ?? status.currentTime;

  const seek = (to: number) => {
    const target = Math.min(Math.max(0, to), duration);
    setSeekTarget(target);
    player.seekTo(target);
  };

  return (
    // the sheet presents from its host on wide windows, so put the host where the info button is
    <Host style={{ position: 'absolute', width: 1, height: 1, right: inset.right + 60, bottom: inset.bottom + 22 }}>
      <BottomSheet isPresented={isOpen} onIsPresentedChange={setIsOpen} fitToContents>
        <VStack spacing={16} modifiers={[padding({ horizontal: 24, top: 28, bottom: 20 }), tint(primary)]}>
          <VStack spacing={2}>
            <Text modifiers={[font({ textStyle: 'headline' })]}>{title}</Text>
            {Object.keys(media).length > 1 ? (
              <Picker
                label={t('chooseRecording')}
                selection={activeMediaId}
                onSelectionChange={setActiveMediaId}
                modifiers={[pickerStyle('menu')]}
              >
                {Object.entries(media).map(([id, m]) => (
                  <Text key={id} modifiers={[tag(id)]}>
                    {name(m)}
                  </Text>
                ))}
              </Picker>
            ) : (
              <Text
                modifiers={[
                  font({ textStyle: 'subheadline' }),
                  foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                ]}
              >
                {name(media[activeMediaId])}
              </Text>
            )}
          </VStack>
          <VStack spacing={4}>
            <Slider
              value={time}
              min={0}
              max={Math.max(duration, 1)}
              onValueChange={setScrubTime}
              onEditingChanged={(isEditing) => {
                if (!isEditing && scrubTime !== null) {
                  seek(scrubTime);
                  setScrubTime(null);
                }
              }}
            />
            <HStack>
              <Text modifiers={[font({ textStyle: 'caption' }), monospacedDigit()]}>{formatTime(time)}</Text>
              <Spacer />
              <Text modifiers={[font({ textStyle: 'caption' }), monospacedDigit()]}>{`-${formatTime(
                duration - time
              )}`}</Text>
            </HStack>
          </VStack>
          <HStack spacing={40}>
            <Button
              systemImage="gobackward.10"
              label={t('skipBack')}
              onPress={() => seek(time - skipSeconds)}
              modifiers={[labelStyle('iconOnly'), font({ size: 26 })]}
            />
            <Button
              systemImage={status.playing ? 'pause.fill' : 'play.fill'}
              label={status.playing ? t('pause') : t('play')}
              onPress={togglePlaying}
              modifiers={[labelStyle('iconOnly'), font({ size: 40 })]}
            />
            <Button
              systemImage="goforward.10"
              label={t('skipForward')}
              onPress={() => seek(time + skipSeconds)}
              modifiers={[labelStyle('iconOnly'), font({ size: 26 })]}
            />
          </HStack>
        </VStack>
      </BottomSheet>
    </Host>
  );
}
