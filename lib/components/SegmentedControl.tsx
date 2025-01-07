import { ComponentPropsWithoutRef } from 'react';

import LibSegmentedControl from '@react-native-segmented-control/segmented-control';

import { DarkTheme, fonts } from '../constants/themes';
import { useThemeColor } from '../hooks/useThemeColor';

export default function SegmentedControl({
  style,
  sliderStyle,
  fontStyle,
  activeFontStyle,
  ...rest
}: ComponentPropsWithoutRef<typeof LibSegmentedControl>) {
  const color = useThemeColor('text');
  const cardDark = useThemeColor('cardDark');
  const primary = useThemeColor('primary');

  return (
    <LibSegmentedControl
      backgroundColor={cardDark}
      style={[{ height: 40, borderRadius: 6 }, style]}
      sliderStyle={{ borderRadius: 4, ...sliderStyle }}
      tintColor={primary}
      fontStyle={{
        color,
        fontSize: 16,
        fontFamily: fonts.regular.fontFamily,
        ...fontStyle,
      }}
      activeFontStyle={{
        fontSize: 16,
        fontFamily: fonts.regular.fontFamily,
        fontWeight: 'normal',
        color: DarkTheme.colors.text,
        ...activeFontStyle,
      }}
      {...rest}
    />
  );
}
