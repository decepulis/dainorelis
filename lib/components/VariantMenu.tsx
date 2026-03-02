import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useColorScheme } from '@/lib/hooks/useColorScheme';

import { GlassView } from 'expo-glass-effect';

import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

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
  const isDark = useColorScheme() === 'dark';

  const actions: MenuAction[] = Object.entries(variants).map(([id, variant]) => {
    return {
      id,
      title: i18n.language === 'en' ? variant['EN Variant Name'] : variant['Variant Name'],
      state: activeVariantId === id ? 'on' : 'off',
      // TODO right now I can't make this dynamic; let's move to the expo/ui menu and see if that helps
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: isLyrics(variant) ? 'text.quote' : 'document',
        default: isLyrics(variant) ? 'format_quote_20px' : 'description_20px',
      }),
    };
  });

  const onPressAction = (e: NativeActionEvent) => {
    const { event } = e.nativeEvent;
    setActiveVariantId(event);
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    isLiquidGlassStyleHeader() ? (
      <GlassView
        style={{
          height: 44,
          borderRadius: 22,
          paddingHorizontal: 22,
          justifyContent: 'center',
        }}
      >
        {children}
      </GlassView>
    ) : (
      children
    );

  return (
    <Wrapper>
      <MenuView
        // on most platforms, this menu ends up left-justified
        hitSlop={Platform.OS === 'ios' ? undefined : { left: 0 }}
        actions={actions}
        onPressAction={onPressAction}
        title={t('variantsMenuTitle')}
      >
        {children}
      </MenuView>
    </Wrapper>
  );
}
