import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { Song } from '@/lib/schemas/songs';

import useOpenFeedback from '../hooks/useOpenFeedback';
import MenuView from './MenuView';

type Props = {
  song: Song;
};
export default function SongMenu({ song }: Props) {
  const { t } = useTranslation();
  const openFeedback = useOpenFeedback();
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const isDark = useColorScheme() === 'dark';

  // TODO song info
  // TODO share sheet (dainorelis.app web app)
  const actions: (MenuAction | null)[] = [
    // {
    //   id: 'info',
    //   title: t('aboutSong'),
    //   imageColor: isDark ? 'white' : 'black',
    //   image: Platform.select({
    //     ios: 'book',
    //     default: 'menu_book_20px',
    //   }),
    //   attributes: { disabled: !hasDescriptions },
    // },
    {
      id: 'feedback',
      title: t('feedback'),
      imageColor: isDark ? 'white' : 'black',
      image: Platform.select({
        ios: 'bubble.left.and.exclamationmark.bubble.right',
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

  const onPressAction = useCallback(
    (e: NativeActionEvent) => {
      const { event } = e.nativeEvent;
      if (event === 'info') {
        console.log('info');
      } else if (event === 'feedback') {
        openFeedback(song.fields.Name);
      } else if (event === 'share') {
        console.log('share');
      }
    },
    [openFeedback, song.fields.Name]
  );

  return (
    <MenuView asButton actions={filteredActions} onPressAction={onPressAction}>
      <FontAwesome6 name="ellipsis" size={18} color="white" />
    </MenuView>
  );
}
