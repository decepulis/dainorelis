import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { router } from 'expo-router';
import { ExtendedStackNavigationOptions } from 'expo-router/build/layouts/StackClient';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { Song } from '@/lib/schemas/songs';

import useOpenFeedback from '../hooks/useOpenFeedback';
import { styles as buttonStyles } from './Button';
import MenuView from './MenuView';
import SystemView from './SystemView';

type Props = {
  song: Song;
};
export default function SongMenu({ song }: Props) {
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const hasTranslation = Object.values(song.fields['Translations']).length > 0;
  const isDark = useColorScheme() === 'dark';

  // TODO share sheet (dainorelis.app web app)
  const actions: (MenuAction | null)[] = [
    {
      id: 'info',
      title: t('aboutSong'),
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: 'book',
        default: 'menu_book_20px',
      }),
      attributes: { disabled: !hasDescriptions },
    },
    {
      id: 'translation',
      title: t('translateSong'),
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: 'translate',
        default: 'translate_20px',
      }),
      attributes: { disabled: !hasTranslation },
    },
    {
      id: 'feedback',
      title: t('feedback'),
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: 'exclamationmark.bubble',
        default: 'feedback_20px',
      }),
    },
    // {
    //   id: 'share',
    //   title: t('shareSong'),
    //   imageColor: isDark ? 'white' : 'black',
    //   image: Platform.select({
    //     ios: 'square.and.arrow.up',
    //     default: 'share_20px',
    //   }),
    //   attributes: { disabled: true },
    // },
  ];
  const filteredActions = actions.filter(Boolean) as MenuAction[];

  const onPressAction = (e: NativeActionEvent) => {
    const { event } = e.nativeEvent;
    if (event === 'info') {
      router.push(`/dainos/${song.id}/aprasymas`);
    } else if (event === 'translation') {
      router.push(`/dainos/${song.id}/vertimas`);
    } else if (event === 'feedback') {
      openFeedback(song.fields.Name);
    } else if (event === 'share') {
      console.log('share');
    }
  };

  return (
    <MenuView actions={filteredActions} onPressAction={onPressAction}>
      <SystemView shadow={false} style={[buttonStyles.button]}>
        <FontAwesome6 name="ellipsis" size={18} color="white" />
      </SystemView>
    </MenuView>
  );
}

export const useSongMenuItem: ({
  song,
}: {
  song: Song;
}) => ReturnType<NonNullable<ExtendedStackNavigationOptions['unstable_headerRightItems']>>[0] = ({ song }) => {
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const hasTranslation = Object.values(song.fields['Translations']).length > 0;

  return {
    type: 'menu',
    label: t('moreOptions'),
    icon: {
      type: 'sfSymbol',
      name: 'ellipsis',
    },
    menu: {
      items: [
        {
          type: 'action',
          label: t('aboutSong'),
          icon: {
            type: 'sfSymbol',
            name: 'book',
          },
          onPress: () => {
            router.push(`/dainos/${song.id}/aprasymas`);
          },
          disabled: !hasDescriptions,
        },
        {
          type: 'action',
          label: t('translateSong'),
          icon: {
            type: 'sfSymbol',
            name: 'translate',
          },
          onPress: () => {
            router.push(`/dainos/${song.id}/vertimas`);
          },
          disabled: !hasTranslation,
        },
        {
          type: 'action',
          label: t('feedback'),
          icon: {
            type: 'sfSymbol',
            name: 'exclamationmark.bubble',
          },
          onPress: () => {
            openFeedback(song.fields.Name);
          },
        },
      ],
    },
  };
};
