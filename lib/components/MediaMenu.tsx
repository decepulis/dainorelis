import { ComponentPropsWithoutRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorValue, Platform, View } from 'react-native';

import { useColorScheme } from '@/lib/hooks/useColorScheme';

import { isLiquidGlassAvailable } from 'expo-glass-effect/build/isLiquidGlassAvailable';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { Audio } from '../schemas/audio';
import { styles as buttonStyles } from './Button';
import MenuView from './MenuView';
import SystemView from './SystemView';

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

  const ButtonWrapper = ({ children }: { children: React.ReactNode }) =>
    isLiquidGlassAvailable() ? (
      <View style={[buttonStyles.button]}>{children}</View>
    ) : (
      <SystemView shadow={false} style={[buttonStyles.button]}>
        {children}
      </SystemView>
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
      <ButtonWrapper>
        <FontAwesome6 name="bars" size={isLiquidGlassAvailable() ? 18 : 14} color={color} />
      </ButtonWrapper>
    </MenuView>
  );
}
