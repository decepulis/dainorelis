import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';

import padding from '@/lib/constants/padding';

import maxWidth from '../constants/maxWidth';

export default function useMaxWidthPadding() {
  const inset = useSafeAreaInsets();
  const { width } = useSafeAreaFrame();

  let paddingLeft = inset.left + padding;
  let paddingRight = inset.right + padding;

  // once we're wider than maxWidth, we don't need to set horizontal padding
  // because it happens naturally as a result of the limited layout
  const maxWidthPadding = (width - maxWidth) / 2;
  if (maxWidthPadding > 0) {
    paddingLeft = Math.max(paddingLeft - maxWidthPadding, 0);
    paddingRight = Math.max(paddingRight - maxWidthPadding, 0);
  }

  return {
    paddingLeft,
    paddingRight,
  };
}
