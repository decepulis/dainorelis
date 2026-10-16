import { ComponentPropsWithoutRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorValue, Platform } from 'react-native';

import { isLiquidGlassAvailable } from 'expo-glass-effect';

import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import { useColorScheme } from '@/lib/hooks/useColorScheme';

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

  // TODO prevent this from morphing the whole gosh darned player
  return (
    <MenuView
      style={style}
      hitSlop={hitSlop}
      actions={actions}
      onPressAction={onPressAction}
      title={t('mediaMenuTitle')}
    >
      <ButtonSurface style={buttonStyles.button}>
        <FontAwesome6 name="bars" iconStyle="solid" size={isLiquidGlassAvailable() ? 18 : 14} color={color} />
      </ButtonSurface>
    </MenuView>
  );
}
