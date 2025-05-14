import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu';

import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import isLyrics from '../utils/isLyrics';
import { buttonSlop } from './Button';

type Props = {
  children?: React.ReactNode;
  variants: (PDFs | Lyrics)[];
  activeVariantIndex: number;
  setActiveVariantIndex: (index: number) => void;
};
export default function VariantMenu({ children, variants, activeVariantIndex, setActiveVariantIndex }: Props) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';

  const actions: MenuAction[] = variants.map((variant, index) => {
    let variantName = variant['Variant Name'];
    if (variantName === 'Žodžiai') {
      variantName = t('lyrics');
    } else if (variantName === 'Natos') {
      variantName = t('sheetMusic');
    }
    return {
      id: index.toString(),
      title: variantName,
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
    <MenuView hitSlop={buttonSlop} actions={actions} onPressAction={onPressAction} title={t('variantsMenuTitle')}>
      {children}
    </MenuView>
  );
}
