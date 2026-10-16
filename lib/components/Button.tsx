import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Touchable, type TouchableProps } from 'react-native-gesture-handler';

import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import SystemView from './SystemView';

const glassWidth = 44;
const basicWidth = 32;
const width = isLiquidGlassAvailable() ? glassWidth : basicWidth;
const slop = (44 - width) / 2;
export const buttonSlop = { top: slop, bottom: slop, left: slop, right: slop };

// Android gets a borderless ripple, iOS dims on press.
const pressFeedback: Pick<TouchableProps, 'androidRipple' | 'activeOpacity'> = Platform.select({
  android: { androidRipple: { borderless: true, radius: 24 } },
  default: { activeOpacity: 0.8 },
});

type Props = {
  children: React.ReactNode;
  /**
   * don't mistake this for Touchable's native hitSlop prop
   * it's implemented with negative margin and positive padding so the touch target is real layout
   * (at the cost of fiddliness)
   */
  hitSlop?: Partial<{
    top: number;
    bottom: number;
    left: number;
    right: number;
  }>;
  noGlass?: boolean;
  innerStyle?: StyleProp<ViewStyle>;
} & Omit<TouchableProps, 'hitSlop'>;

export default function Button({ children, style, hitSlop: argHitSlop, noGlass, innerStyle, ...rest }: Props) {
  const hitSlop = {
    ...buttonSlop,
    ...argHitSlop,
  };

  const Wrapper = isLiquidGlassAvailable() ? (noGlass ? View : GlassView) : SystemView;

  return (
    // TODO iPad cursor hover styles
    // TODO A11y label
    <Touchable
      {...pressFeedback}
      style={[
        {
          marginLeft: -hitSlop.left,
          marginRight: -hitSlop.right,
          marginTop: -hitSlop.top,
          marginBottom: -hitSlop.bottom,
          paddingLeft: hitSlop.left,
          paddingRight: hitSlop.right,
          paddingTop: hitSlop.top,
          paddingBottom: hitSlop.bottom,
        },
        style,
      ]}
      {...rest}
    >
      <Wrapper shadow={false} style={[styles.button, innerStyle]}>
        {children}
      </Wrapper>
    </Touchable>
  );
}

/**
 * A non-interactive button background: plain on Liquid Glass (the parent supplies the glass),
 * SystemView everywhere else.
 */
export function ButtonSurface({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return isLiquidGlassAvailable() ? (
    <View style={style}>{children}</View>
  ) : (
    <SystemView shadow={false} style={style}>
      {children}
    </SystemView>
  );
}

export const styles = StyleSheet.create({
  button: {
    borderRadius: width,
    width: width,
    height: width,
    flexBasis: width,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
