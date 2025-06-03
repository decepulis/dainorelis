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
  variants: (PDFs | Lyrics)[];
  activeVariantIndex: number;
  setActiveVariantIndex: (index: number) => void;
};
export default function VariantMenu({ children, variants, activeVariantIndex, setActiveVariantIndex }: Props) {
  const { t, i18n } = useTranslation();
  const isDark = useColorScheme() === 'dark';

  const actions: MenuAction[] = variants.map((variant, index) => {
    return {
      id: index.toString(),
      title: i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name'],
      state: activeVariantIndex === index ? 'on' : 'off',
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
      setActiveVariantIndex(Number(event));
    },
    [setActiveVariantIndex]
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
