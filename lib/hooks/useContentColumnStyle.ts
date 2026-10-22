import type { ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';

/**
 * A centred reading column: at most `maxWidth` of content, with `padding` on each side clear of the
 * horizontal safe area (landscape notches, the closed iPhone Duo's toolbar strip). Plain flex layout,
 * no window maths, so it fits whatever the screen is: a full window, an iPad form sheet, a split.
 * Full-bleed backgrounds (the song title band) belong outside the column.
 */
export default function useContentColumnStyle(): ViewStyle {
  const inset = useSafeAreaInsets();
  return {
    width: '100%',
    maxWidth: maxWidth + padding * 2 + inset.left + inset.right,
    marginHorizontal: 'auto',
    paddingLeft: inset.left + padding,
    paddingRight: inset.right + padding,
  };
}
