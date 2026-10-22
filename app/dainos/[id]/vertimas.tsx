import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams } from 'expo-router';

import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import { HeaderBackground, HeaderLeft, HeaderTitle, ModalToolbar } from '@/lib/components/Header';
import Markdown from '@/lib/components/Markdown';
import NotFound from '@/lib/components/NotFound';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import ThemedText from '@/lib/components/ThemedText';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import useContentColumnStyle from '@/lib/hooks/useContentColumnStyle';
import useOpenFeedback from '@/lib/hooks/useOpenFeedback';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import useTopScrollEdgeEffect from '@/lib/hooks/useTopScrollEdgeEffect';
import { Song } from '@/lib/schemas/songs';
import { Translations } from '@/lib/schemas/translations';
import { splitTitle } from '@/lib/utils/useTitle';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = songs.find((song) => song.id === id);
  if (!song) {
    return <NotFound modal message={t('songNotFound')} />;
  }
  // a few songs have no translation ("Translations": {})
  const firstTranslation = Object.values(song.fields['Translations'])[0] as Translations | undefined;
  if (!firstTranslation) {
    return <NotFound modal message={t('pageNotFound')} />;
  }
  return <TranslationPage song={song} firstTranslation={firstTranslation} />;
}

function TranslationPage({ song, firstTranslation }: { song: Song; firstTranslation: Translations }) {
  const inset = useSafeAreaInsets();
  const contentColumn = useContentColumnStyle();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const topScrollEdgeEffect = useTopScrollEdgeEffect(scrollRef);
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const primary = useThemeColor('primary');
  const text = useThemeColor('text');
  const { isHighContrastEnabled } = useAccessibilityInfo();

  const [ogTitle] = splitTitle(song.fields['Name']);
  const [title, subtitle] = splitTitle(firstTranslation['Title']);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: (props) => <HeaderLeft {...props} modal />,
          headerBackground: () => <HeaderBackground />,
          scrollEdgeEffects: topScrollEdgeEffect,
          headerTitle: () => <HeaderTitle showTitle title={t('translationTitle')} subtitle={ogTitle} />,
        }}
      />
      <ModalToolbar />
      <ScrollViewWithHeader ref={scrollRef}>
        <View
          style={[
            contentColumn,
            {
              paddingTop: padding * 2,
              paddingBottom: Math.max(inset.bottom + padding * 2, padding * 4),
            },
          ]}
        >
          <View style={[styles.titleAndSubtitle, { paddingBottom: padding }]}>
            <ThemedText bold style={[styles.mainTitle]}>
              {title}
            </ThemedText>
            {subtitle ? <ThemedText style={[styles.subtitle]}>{subtitle}</ThemedText> : null}
          </View>
          <Markdown>{firstTranslation['Lyrics']}</Markdown>
          {firstTranslation['AI Generated'] ? (
            <View style={{ marginTop: padding * 2, opacity: isHighContrastEnabled ? 1 : 0.7 }}>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: padding / 2 }}
                onPress={() => openFeedback(song.fields['Name'])}
                hitSlop={{ top: padding / 2, bottom: padding / 2, left: padding, right: padding }}
              >
                {({ pressed }) => (
                  <>
                    <FontAwesome6 name="wand-magic-sparkles" iconStyle="solid" size={12} color={text} />
                    <View style={{ flexShrink: 1 }}>
                      <ThemedText>
                        {t('genAiText1')}{' '}
                        <ThemedText
                          style={[
                            { textDecorationLine: pressed ? undefined : 'underline', textDecorationColor: primary },
                          ]}
                        >
                          {t('genAiText2')}
                        </ThemedText>
                      </ThemedText>
                    </View>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollViewWithHeader>
    </>
  );
}

const styles = StyleSheet.create({
  titleAndSubtitle: {
    flexShrink: 1,
  },
  mainTitle: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 19,
  },
});
