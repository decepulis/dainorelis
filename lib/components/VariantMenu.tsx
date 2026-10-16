import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { GlassView } from 'expo-glass-effect';

import Description from '@expo/material-symbols/description.xml';
import FormatQuote from '@expo/material-symbols/format_quote.xml';
import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';

import { Lyrics } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import isLyrics from '../utils/isLyrics';
import { isLiquidGlassStyleHeader } from './Header';
import MenuView from './MenuView';

type Props = {
  children?: React.ReactNode;
  variants: { [id: string]: PDFs | Lyrics };
  activeVariantId: string | undefined;
  setActiveVariantId: (id: string) => void;
};
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
    <VariantMenuSurface>
      <MenuView
        // on most platforms, this menu ends up left-justified
        hitSlop={Platform.OS === 'ios' ? undefined : { left: 0 }}
        actions={actions}
        onPressAction={onPressAction}
        title={t('variantsMenuTitle')}
      >
        {children}
      </MenuView>
    </VariantMenuSurface>
  );
}

function VariantMenuSurface({ children }: { children: React.ReactNode }) {
  return isLiquidGlassStyleHeader() ? (
    <GlassView style={{ height: 44, borderRadius: 22, paddingHorizontal: 22, justifyContent: 'center' }}>
      {children}
    </GlassView>
  ) : (
    children
  );
}
