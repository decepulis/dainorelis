import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import { HeaderBackground, HeaderLeft, HeaderTitle } from '@/lib/components/Header';
import Markdown from '@/lib/components/Markdown';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import useMaxWidthPadding from '@/lib/hooks/useMaxWidthPadding';
import useOpenFeedback from '@/lib/hooks/useOpenFeedback';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import { Song } from '@/lib/schemas/songs';
import { splitTitle } from '@/lib/utils/useTitle';
import songs from '@/songs';

export async function generateStaticParams() {
  return songs.map((song) => ({ id: song.id }));
}

export default function Page() {
  const inset = useSafeAreaInsets();
  const maxWidthPadding = useMaxWidthPadding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = useMemo(() => songs.find((song) => song.id === id), [id]) as Song;
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const primary = useThemeColor('primary');
  const { isHighContrastEnabled } = useAccessibilityInfo();
  const [isPressed, setIsPressed] = useState(false);
  const firstTranslation = Object.values(song.fields['Translations'])[0];

  if (!song || !firstTranslation) {
    // TODO 404 not found
  }

  const [ogTitle] = splitTitle(song.fields['Name']);
  const [title, subtitle] = splitTitle(firstTranslation['Title']);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: (props) => <HeaderLeft {...props} modal />,
          headerBackground: () => <HeaderBackground opaque />,
          headerTitle: () => <HeaderTitle showTitle subtitle={t('translationTitle')} title={ogTitle} />,
        }}
      />
      <ScrollViewWithHeader>
        <View
          style={[
            styles.container,
            {
              paddingLeft: maxWidthPadding.paddingLeft,
              paddingRight: maxWidthPadding.paddingRight,
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
          {song.fields['AI-Generated Description'] ? (
            <View style={{ marginTop: padding * 2, opacity: isHighContrastEnabled ? 1 : 0.7 }}>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: padding / 2 }}
                onPressIn={() => setIsPressed(true)}
                onPressOut={() => setIsPressed(false)}
                onPress={() => openFeedback(song.fields['Name'])}
                hitSlop={{ top: padding / 2, bottom: padding / 2, left: padding, right: padding }}
              >
                <FontAwesome6 name="wand-magic-sparkles" size={12} />
                <View style={{ flexShrink: 1 }}>
                  <ThemedText>
                    {t('genAiText1')}{' '}
                    <ThemedText
                      style={[
                        { textDecorationLine: isPressed ? undefined : 'underline', textDecorationColor: primary },
                      ]}
                    >
                      {t('genAiText2')}
                    </ThemedText>
                  </ThemedText>
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollViewWithHeader>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
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
