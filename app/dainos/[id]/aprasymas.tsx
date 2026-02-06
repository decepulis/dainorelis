import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams } from 'expo-router';

import { HeaderBackground, HeaderLeft, HeaderTitle, ModalToolbar } from '@/lib/components/Header';
import Markdown from '@/lib/components/Markdown';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useMaxWidthPadding from '@/lib/hooks/useMaxWidthPadding';
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
  const { t, i18n } = useTranslation();

  if (!song || !song.fields['LT Description']) {
    // TODO 404 not found
  }

  const [title] = splitTitle(song.fields['Name']);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: (props) => <HeaderLeft {...props} modal />,
          headerBackground: () => <HeaderBackground opaque />,
          headerTitle: () => <HeaderTitle showTitle title={t('aboutSongTitle')} subtitle={title} />,
        }}
      />
      <ModalToolbar />
      <ScrollViewWithHeader>
        <View
          style={[
            styles.container,
            {
              paddingLeft: maxWidthPadding.paddingLeft,
              paddingRight: maxWidthPadding.paddingRight,
              paddingTop: padding,
              paddingBottom: Math.max(inset.bottom + padding * 2, padding * 4),
            },
          ]}
        >
          <Markdown>
            {i18n.language === 'en'
              ? (song.fields['EN Description'] ?? song.fields['LT Description'])
              : song.fields['LT Description']}
          </Markdown>
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
});
