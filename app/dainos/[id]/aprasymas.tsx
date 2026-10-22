import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack, useLocalSearchParams } from 'expo-router';

import { HeaderBackground, HeaderLeft, HeaderTitle, ModalToolbar } from '@/lib/components/Header';
import Markdown from '@/lib/components/Markdown';
import NotFound from '@/lib/components/NotFound';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import padding from '@/lib/constants/padding';
import useContentColumnStyle from '@/lib/hooks/useContentColumnStyle';
import useTopScrollEdgeEffect from '@/lib/hooks/useTopScrollEdgeEffect';
import { Song } from '@/lib/schemas/songs';
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
  // SongMenu offers this screen when either description exists
  if (!song.fields['LT Description'] && !song.fields['EN Description']) {
    return <NotFound modal message={t('pageNotFound')} />;
  }
  return <DescriptionPage song={song} />;
}

function DescriptionPage({ song }: { song: Song }) {
  const inset = useSafeAreaInsets();
  const contentColumn = useContentColumnStyle();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const topScrollEdgeEffect = useTopScrollEdgeEffect(scrollRef);
  const { t, i18n } = useTranslation();

  const [title] = splitTitle(song.fields['Name']);

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: (props) => <HeaderLeft {...props} modal />,
          headerBackground: () => <HeaderBackground opaque />,
          scrollEdgeEffects: topScrollEdgeEffect,
          headerTitle: () => <HeaderTitle showTitle title={t('aboutSongTitle')} subtitle={title} />,
        }}
      />
      <ModalToolbar />
      <ScrollViewWithHeader ref={scrollRef}>
        <View
          style={[
            contentColumn,
            {
              paddingTop: padding,
              paddingBottom: Math.max(inset.bottom + padding * 2, padding * 4),
            },
          ]}
        >
          <Markdown>
            {i18n.language === 'en'
              ? (song.fields['EN Description'] ?? song.fields['LT Description'])
              : (song.fields['LT Description'] ?? song.fields['EN Description'])}
          </Markdown>
        </View>
      </ScrollViewWithHeader>
    </>
  );
}
