import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import isLyrics from '../utils/isLyrics';
import MenuView from './MenuView';

type Props = {
  children?: React.ReactNode;
  variants: { [id: string]: PDFs | Lyrics };
  activeVariantId: string;
  setActiveVariantId: (id: string) => void;
};
export default function VariantMenu({ children, variants, activeVariantId, setActiveVariantId }: Props) {
  const { t, i18n } = useTranslation();
  const isDark = useColorScheme() === 'dark';

  const actions: MenuAction[] = Object.entries(variants).map(([id, variant]) => {
    return {
      id,
      title: i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name'],
      state: activeVariantId === id ? 'on' : 'off',
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: isLyrics(variant) ? 'text.quote' : 'document',
        default: isLyrics(variant) ? 'format_quote_20px' : 'description_20px',
      }),
    };
  });

  const onPressAction = useCallback(
    (e: NativeActionEvent) => {
      const { event } = e.nativeEvent;
      setActiveVariantId(event);
    },
    [setActiveVariantId]
  );

  return (
    <MenuView
      // on most platforms, this menu ends up left-justified
      hitSlop={Platform.OS === 'ios' ? undefined : { left: 0 }}
      actions={actions}
      onPressAction={onPressAction}
      title={t('variantsMenuTitle')}
    >
      {children}
    </MenuView>
  );
}
