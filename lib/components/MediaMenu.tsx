import { ComponentPropsWithoutRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { Audio } from '../schemas/audio';
import MenuView from './MenuView';

type Props = {
  media: Audio[];
  activeMediaIndex: number;
  setActiveMediaIndex: (index: number) => void;
  style?: ComponentPropsWithoutRef<typeof MenuView>['style'];
  hitSlop?: ComponentPropsWithoutRef<typeof MenuView>['hitSlop'];
};
export default function MediaMenu({ media, activeMediaIndex, setActiveMediaIndex, hitSlop, style }: Props) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';

  const actions: MenuAction[] = media.map((m, index) => {
    let mediaName = m['Variant Name'];
    mediaName = mediaName.replace('Įrašas', t('media'));
    return {
      id: index.toString(),
      title: mediaName,
      state: activeMediaIndex === index ? 'on' : 'off',
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: 'music.note',
        default: 'music_note_20px',
      }),
    };
  });

  const onPressAction = useCallback(
    (e: NativeActionEvent) => {
      const { event } = e.nativeEvent;
      setActiveMediaIndex(Number(event));
    },
    [setActiveMediaIndex]
  );

  return (
    <MenuView
      asButton
      style={style}
      hitSlop={hitSlop}
      actions={actions}
      onPressAction={onPressAction}
      title={t('mediaMenuTitle')}
    >
      <FontAwesome6 name="bars" size={14} color="white" />
    </MenuView>
  );
}
