import { ComponentPropsWithoutRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { Audio } from '../schemas/audio';
import MenuView from './MenuView';

type Props = {
  media: { [id: string]: Audio };
  activeMediaId: string;
  setActiveMediaId: (id: string) => void;
  style?: ComponentPropsWithoutRef<typeof MenuView>['style'];
  hitSlop?: ComponentPropsWithoutRef<typeof MenuView>['hitSlop'];
};
export default function MediaMenu({ media, activeMediaId, setActiveMediaId, hitSlop, style }: Props) {
  const { t, i18n } = useTranslation();
  const isDark = useColorScheme() === 'dark';

  const actions: MenuAction[] = Object.entries(media).map(([id, m]) => {
    return {
      id,
      title: i18n.language === 'en' ? m['EN Variant Name'] : m['Variant Name'],
      state: activeMediaId === id ? 'on' : 'off',
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
      setActiveMediaId(event);
    },
    [setActiveMediaId]
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
