import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

import { FontAwesome6 } from '@expo/vector-icons';
import { MenuAction, MenuView, NativeActionEvent } from '@react-native-menu/menu';

import useStorage from '@/lib/hooks/useStorage';
import { Song } from '@/lib/schemas/songs';

import { useThemeColor } from '../hooks/useThemeColor';
import Button, { buttonSlop, styles as buttonStyles } from './Button';
import SystemView from './SystemView';

type Props = {
  song: Song;
};
export default function SongMenu({ song }: Props) {
  const { t } = useTranslation();
  const hasDescriptions = !!song.fields['LT Description'] || !!song.fields['EN Description'];
  const isDark = useColorScheme() === 'dark';
  const primary = useThemeColor('primary');
  const { value: favorites, setValue: setFavorites } = useStorage('favorites');
  const isFavorite = useMemo(() => favorites.includes(song.id), [favorites, song.id]);

  // TODO song info
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

  const removeFavorite = useCallback(() => {
    setFavorites(favorites.filter((id) => id !== song.id));
  }, [favorites, song.id, setFavorites]);

  const addFavorite = useCallback(async () => {
    setFavorites([...favorites, song.id]);
  }, [favorites, song.id, setFavorites]);

  const onPressAction = useCallback(
    (e: NativeActionEvent) => {
      const { event } = e.nativeEvent;
      if (event === 'info') {
        console.log('info');
      } else if (event === 'feedback') {
        WebBrowser.openBrowserAsync(`${t('feedbackUrl')}${encodeURIComponent(song.fields.Name)}`, {
          controlsColor: primary,
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          dismissButtonStyle: 'close',
        });
      } else if (event === 'share') {
        console.log('share');
      }
    },
    [primary, song.fields.Name, t]
  );

  return (
    <>
      <Button
        onPress={isFavorite ? removeFavorite : addFavorite}
        haptics={isFavorite ? Haptics.ImpactFeedbackStyle.Soft : Haptics.ImpactFeedbackStyle.Medium}
        hitSlop={buttonSlop}
      >
        <FontAwesome6 name="heart" solid={isFavorite} size={16} color="white" />
      </Button>
      <MenuView hitSlop={buttonSlop} actions={filteredActions} onPressAction={onPressAction}>
        <SystemView variant="primary" shadow={false} style={buttonStyles.container}>
          <FontAwesome6 name="ellipsis" size={18} color="white" />
        </SystemView>
      </MenuView>
    </>
  );
}
