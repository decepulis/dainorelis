import { ComponentPropsWithoutRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu';

import { Audio } from '../schemas/audio';
import { buttonSlop } from './Button';

type Props = {
  children?: React.ReactNode;
  media: Audio[];
  activeMediaIndex: number;
  setActiveMediaIndex: (index: number) => void;
  style?: ComponentPropsWithoutRef<typeof MenuView>['style'];
};
export default function MediaMenu({ children, media, activeMediaIndex, setActiveMediaIndex, style }: Props) {
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
      style={style}
      hitSlop={buttonSlop}
      actions={actions}
      onPressAction={onPressAction}
      title={t('mediaMenuTitle')}
    >
      {children}
    </MenuView>
  );
}
