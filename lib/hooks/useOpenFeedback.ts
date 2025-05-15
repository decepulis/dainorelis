import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import * as WebBrowser from 'expo-web-browser';

import { useThemeColor } from './useThemeColor';

export default function useOpenFeedback() {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');

  const openFeedback = useCallback(
    (songName = '') =>
      WebBrowser.openBrowserAsync(`${t('feedbackUrl')}${encodeURIComponent(songName)}`, {
        controlsColor: primary,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        dismissButtonStyle: 'close',
      }),
    [primary, t]
  );

  return openFeedback;
}
