import { ComponentPropsWithoutRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorValue } from 'react-native';

import { isLiquidGlassAvailable } from 'expo-glass-effect';

import MusicNote from '@expo/material-symbols/music_note.xml';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import { Audio } from '../schemas/audio';
import { ButtonSurface, styles as buttonStyles } from './Button';
import MenuView from './MenuView';

type Props = {
  media: { [id: string]: Audio };
  activeMediaId: string | undefined;
  setActiveMediaId: (id: string) => void;
  style?: ComponentPropsWithoutRef<typeof MenuView>['style'];
  hitSlop?: ComponentPropsWithoutRef<typeof MenuView>['hitSlop'];
  color: ColorValue;
};
export default function MediaMenu({ media, activeMediaId, setActiveMediaId, hitSlop, style, color }: Props) {
  const { t, i18n } = useTranslation();

  const actions: MenuAction[] = Object.entries(media).map(([id, m]) => {
    return {
      id,
      title: i18n.language === 'en' ? m['EN Variant Name'] : m['Variant Name'],
      state: activeMediaId === id ? 'on' : 'off',
      image: process.env.EXPO_OS === 'ios' ? 'music.note' : MusicNote,
    };
  });

  const onPressAction = (e: NativeActionEvent) => {
    const { event } = e.nativeEvent;
    setActiveMediaId(event);
  };

  // TODO prevent this from morphing the whole gosh darned player
  return (
    <MenuView
      style={style}
      hitSlop={hitSlop}
      actions={actions}
      onPressAction={onPressAction}
      title={t('mediaMenuTitle')}
      accessibilityLabel={t('chooseRecording')}
    >
      <ButtonSurface style={buttonStyles.button}>
        <FontAwesome6 name="bars" iconStyle="solid" size={isLiquidGlassAvailable() ? 18 : 14} color={color} />
      </ButtonSurface>
    </MenuView>
  );
}
