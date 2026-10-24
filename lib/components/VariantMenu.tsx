import { useTranslation } from 'react-i18next';

import Description from '@expo/material-symbols/description.xml';
import FormatQuote from '@expo/material-symbols/format_quote.xml';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';

import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import isLyrics from '../utils/isLyrics';
import MenuView from './MenuView';

type Props = {
  children?: React.ReactNode;
  variants: { [id: string]: PDFs | Lyrics };
  activeVariantId: string | undefined;
  setActiveVariantId: (id: string) => void;
};
/** The custom header's variant menu (Android, iOS before 26); Liquid Glass uses a native title menu */
export default function VariantMenu({ children, variants, activeVariantId, setActiveVariantId }: Props) {
  const { t, i18n } = useTranslation();

  const actions: MenuAction[] = Object.entries(variants).map(([id, variant]) => {
    return {
      id,
      title: i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name'],
      state: activeVariantId === id ? 'on' : 'off',
      image: isLyrics(variant)
        ? process.env.EXPO_OS === 'ios'
          ? 'text.quote'
          : FormatQuote
        : process.env.EXPO_OS === 'ios'
          ? 'document'
          : Description,
    };
  });

  const onPressAction = (e: NativeActionEvent) => {
    const { event } = e.nativeEvent;
    setActiveVariantId(event);
  };

  return (
    <MenuView
      // on most platforms, this menu ends up left-justified
      hitSlop={process.env.EXPO_OS === 'ios' ? undefined : { left: 0 }}
      actions={actions}
      onPressAction={onPressAction}
      title={t('variantsMenuTitle')}
      // the label is the title and variant name the trigger shows
      accessibilityHint={t('variantsMenuHint')}
    >
      {children}
    </MenuView>
  );
}
