import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AccessibilityActionEvent,
  DynamicColorIOS,
  type LayoutChangeEvent,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  type AnimatedRef,
  ReduceMotion,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-screens/experimental';
import { scheduleOnRN } from 'react-native-worklets';

import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import { type SongListItem } from '@/lib/hooks/useSongList';
import { useThemeColor } from '@/lib/hooks/useThemeColor';
import haptic from '@/lib/utils/haptic';
import withAlpha from '@/lib/utils/withAlpha';

import SystemView from '../SystemView';
import ThemedText from '../ThemedText';
import { ListHeader, ListItemContent } from './ListItem';

// each letter's height; larger text sizes grow them up to maxScale, then letters give way to dots
const letterHeight = 16;
const maxScale = 1.4;
// the capsule behind the letters and its padding above and below them, flush with the screen's trailing edge as
// Contacts' index is. The touch area runs on toward the rows, 44pt wide in all
const capsuleWidth = 20;
const capsulePadding = 5;
const leadingSlop = 44 - capsuleWidth;
/** the trailing padding rows need beside the index, to keep their icons clear of its capsule */
export const sectionIndexRowPadding = capsuleWidth + Math.round(padding / 3);
// beside a wide layout's card the index sits in the gutter, reaching as far out from the card as it reaches into
// the rows it sits over: a column of the card's width plus that reach either side, centred as the card is
const columnMaxWidth = maxWidth + sectionIndexRowPadding * 2;
// on Liquid Glass the letters take the label color, as the player's controls do; on the app's green surface, white
const letterColor = isLiquidGlassAvailable() ? DynamicColorIOS({ light: '#000000', dark: '#ffffff' }) : '#ffffff';
// the letter shown large mid-screen while the index is touched, and how long it stays once the finger lifts
const bigLetterBoxSize = 96;
const bigLetterHoldMs = 500;
const bigLetterFadeMs = 200;

/** a row's place in the list's content, below the list header */
export type RowLayout = { y: number; height: number };

type RowMeasurerProps = {
  items: SongListItem[];
  favoriteIds: Set<string>;
  primary: string;
  background: string;
  separator: string;
  /** the list's horizontal safe area */
  left: number;
  right: number;
  /** the rows' trailing padding, as the list's */
  trailingPadding?: number;
  /** every row's layout, once all are measured */
  onMeasure: (layouts: RowLayout[]) => void;
};
/**
 * The list's rows laid out unseen, at the list's width, to know where every row is before the list renders it:
 * titles wrap differently with the width and the text size, so rows have no fixed height. Its transparent
 * (iOS) or alpha-0 (Android) views aren't drawn.
 */
export function RowMeasurer({
  items,
  favoriteIds,
  primary,
  background,
  separator,
  left,
  right,
  trailingPadding,
  onMeasure,
}: RowMeasurerProps) {
  const layouts = useRef<RowLayout[]>([]);
  const frame = useRef<number | null>(null);
  // a layout pass reports many rows at once: they're collected into one update
  const onRowLayout = (index: number, e: LayoutChangeEvent) => {
    layouts.current[index] = { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const measured = layouts.current.slice(0, items.length);
      if (measured.length === items.length && measured.every(Boolean)) onMeasure(measured);
    });
  };
  return (
    <View
      style={[styles.measurer, { left, right }]}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      {items.map((item, index) => (
        <View key={item.id} style={styles.row} onLayout={(e) => onRowLayout(index, e)}>
          {item.type === 'header' ? (
            <ListHeader title={item.item} background={background} separator={separator} />
          ) : (
            <ListItemContent
              item={item.item}
              primary={primary}
              background={background}
              isFavorite={favoriteIds.has(item.item.id)}
              trailingPadding={trailingPadding}
            />
          )}
        </View>
      ))}
    </View>
  );
}

/** a letter section's header, and where it sits in the list's content */
export type IndexSection = { letter: string; offset: number };

type SectionIndexProps = {
  sections: IndexSection[];
  /** whether the sections' offsets are measured, rather than estimated */
  isMeasured: boolean;
  listRef: AnimatedRef<Animated.FlatList<any>>;
  /** how many times the list has been dragged */
  dragCount: SharedValue<number>;
  /** how far below the list's top a section's header lands: under the navigation bar */
  topInset: number;
  /** the list's content height and its own, so a jump near the end stops at the end */
  contentHeight: SharedValue<number>;
  listHeight: number;
  /** the band of the screen the index centres in: below the navigation bar and above the bottom bar */
  top: number;
  bottom: number;
};
/**
 * The jump-to-letter index at the list's trailing edge, as in Contacts: touching or dragging along it jumps to
 * that letter's section. Its letters sit on a capsule (Liquid Glass, or the app's other floating controls'
 * surface), so it shows over the forest as over the rows. Screen readers get one adjustable element, swiped up and
 * down a letter at a time.
 *
 * It's placed by layout alone, never from the window's size or the safe area insets (which can lag a resize, a fold
 * or a rotation by a render): at the screen's trailing edge, inside the horizontal safe area (measured natively). In
 * a wide layout it belongs to the list's card, as UIKit's index belongs to its table: just outside the card's
 * trailing edge, or, where the gutter is too narrow for it, at the screen's edge over the card, whose rows then keep
 * their icons clear of it.
 */
export default function SectionIndex({
  sections,
  isMeasured,
  listRef,
  dragCount,
  topInset,
  contentHeight,
  listHeight,
  top,
  bottom,
}: SectionIndexProps) {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const rowHeight = Math.round(letterHeight * Math.min(fontScale, maxScale));
  const [availableHeight, setAvailableHeight] = useState(0);

  // where each section's header is scrolled to, under the navigation bar
  const offsets = sections.map((section) => Math.max(0, section.offset - topInset));
  const count = sections.length;

  // short of room (landscape, the largest text sizes), every other row is a dot, standing for the letters
  // between its neighbours, as in iOS's own index
  const maxRows = Math.max(3, Math.floor((availableHeight - capsulePadding * 2) / rowHeight));
  let rows = sections.map((section) => section.letter);
  if (count > maxRows) {
    const shown = Math.floor((maxRows + 1) / 2);
    rows = Array.from({ length: shown }, (_, i) => sections[Math.round((i * (count - 1)) / (shown - 1))].letter);
    rows = rows.flatMap((letter, i) => (i === 0 ? [letter] : ['•', letter]));
  }
  const columnHeight = rows.length * rowHeight;

  // the section the list is at, for screen readers
  const [current, setCurrent] = useState(0);
  const scrollOffset = useScrollOffset(listRef);
  useAnimatedReaction(
    () => {
      const y = scrollOffset.get() + 1;
      let section = 0;
      while (section + 1 < offsets.length && offsets[section + 1] <= y) section++;
      return section;
    },
    (section, previous) => {
      if (section !== previous) scheduleOnRN(setCurrent, section);
    }
  );

  // scrolled from JS, where the list follows its scroll events to render the rows there
  const offsetOf = (section: number) => Math.min(offsets[section], Math.max(0, contentHeight.get() - listHeight));
  // a jump made before the rows were measured, to an estimated offset
  const estimatedJump = useRef<{ section: number; dragCount: number } | null>(null);
  const jumpTo = (section: number) => {
    if (section < 0 || section >= count) return;
    setCurrent(section);
    estimatedJump.current = isMeasured ? null : { section, dragCount: dragCount.get() };
    listRef.current?.scrollToOffset({ offset: offsetOf(section), animated: false });
  };
  // once the rows are measured, it lands exactly, unless the list has been dragged since
  useEffect(() => {
    const jump = estimatedJump.current;
    if (!isMeasured || !jump) return;
    estimatedJump.current = null;
    if (jump.dragCount === dragCount.get()) {
      listRef.current?.scrollToOffset({ offset: offsetOf(jump.section), animated: false });
    }
  });
  // the finger's section, while it's down, and the latest one it asked for: dragged fast, the JS thread can fall
  // behind, so it skips to the latest rather than through every section passed
  const selected = useSharedValue(-1);
  const target = useSharedValue(-1);
  // the section the big letter shows; unlike selected, it stays as the letter fades
  const bigLetterSection = useSharedValue(0);

  // While the index is touched, its letter shows large mid-screen, before the list catches up with the rows there.
  // The letter and its fading run on the UI thread, so they keep up with the finger however busy JS is. Liquid
  // Glass fades by materializing (an opacity on a glass view or its ancestors breaks the effect), driven from JS
  const isGlass = isLiquidGlassAvailable();
  const bigLetterOpacity = useSharedValue(0);
  const [isGlassShown, setIsGlassShown] = useState(false);
  const glassTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const showGlass = () => {
    clearTimeout(glassTimer.current);
    setIsGlassShown(true);
  };
  const hideGlassLater = () => {
    clearTimeout(glassTimer.current);
    glassTimer.current = setTimeout(() => setIsGlassShown(false), bigLetterHoldMs);
  };
  useEffect(() => () => clearTimeout(glassTimer.current), []);
  const jumpToTarget = (section: number) => {
    if (section === target.get()) jumpTo(section);
  };
  // y is from the capsule's top, above its padding
  const select = (y: number) => {
    'worklet';
    y -= capsulePadding;
    const section = Math.min(count - 1, Math.max(0, Math.floor((y / columnHeight) * count)));
    if (section === selected.get()) return;
    selected.set(section);
    bigLetterSection.set(section);
    target.set(section);
    scheduleOnRN(jumpToTarget, section);
    scheduleOnRN(haptic, 'tick');
  };
  const gesture = usePanGesture({
    minDistance: 0,
    onBegin: (e) => {
      select(e.y);
      bigLetterOpacity.set(withTiming(1, { duration: bigLetterFadeMs / 2, reduceMotion: ReduceMotion.Never }));
      if (isGlass) scheduleOnRN(showGlass);
    },
    onUpdate: (e) => select(e.y),
    onFinalize: () => {
      selected.set(-1);
      bigLetterOpacity.set(
        withDelay(bigLetterHoldMs, withTiming(0, { duration: bigLetterFadeMs, reduceMotion: ReduceMotion.Never }))
      );
      if (isGlass) scheduleOnRN(hideGlassLater);
    },
  });

  const onAccessibilityAction = ({ nativeEvent: { actionName } }: AccessibilityActionEvent) => {
    if (actionName === 'increment') jumpTo(current + 1);
    else if (actionName === 'decrement') jumpTo(current - 1);
  };

  const Capsule = isGlass ? GlassView : SystemView;

  return (
    <>
      <BigLetter
        letters={sections.map((section) => section.letter)}
        section={bigLetterSection}
        opacity={bigLetterOpacity}
        isGlassShown={isGlassShown}
      />
      <SafeAreaView
        edges={{ left: true, right: true }}
        style={[styles.container, { top, bottom }]}
        pointerEvents="box-none"
        onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}
      >
        {availableHeight > 0 ? (
          <View style={styles.column} pointerEvents="box-none">
            <GestureDetector gesture={gesture}>
              <View style={styles.touchArea}>
                <Capsule
                  shadow={false}
                  accessible
                  accessibilityRole="adjustable"
                  accessibilityLabel={t('sectionIndex')}
                  accessibilityValue={{ text: sections[current]?.letter }}
                  accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
                  onAccessibilityAction={onAccessibilityAction}
                  style={[styles.capsule, { height: columnHeight + capsulePadding * 2 }]}
                >
                  {rows.map((letter, i) => (
                    <ThemedText
                      key={i}
                      title
                      bold
                      maxFontSizeMultiplier={maxScale}
                      // the line height scales with the text, as rowHeight does
                      style={[styles.letter, { color: letterColor, height: rowHeight, lineHeight: letterHeight }]}
                    >
                      {letter}
                    </ThemedText>
                  ))}
                </Capsule>
              </View>
            </GestureDetector>
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

type BigLetterProps = {
  letters: string[];
  section: SharedValue<number>;
  opacity: SharedValue<number>;
  /** Liquid Glass: whether the box is materialized */
  isGlassShown: boolean;
};
/**
 * The index's letter, large in a translucent box mid-screen. Every letter is laid out, one shown, so changing it
 * takes no render. Screen readers skip it: the index's adjustable value already says the letter.
 */
function BigLetter({ letters, section, opacity, isGlassShown }: BigLetterProps) {
  const { isReduceMotionEnabled } = useAccessibilityInfo();
  const chrome = useThemeColor('chrome');
  const isGlass = isLiquidGlassAvailable();
  // a slight grow as it appears, unless Reduce Motion is on; Liquid Glass materializes in its own way
  const boxStyle = useAnimatedStyle(() =>
    isGlass
      ? {}
      : {
          opacity: opacity.get(),
          transform: [{ scale: isReduceMotionEnabled ? 1 : 0.9 + 0.1 * opacity.get() }],
        }
  );
  const lettersStyle = useAnimatedStyle(() => (isGlass ? { opacity: opacity.get() } : {}));
  return (
    <View
      style={styles.bigLetterContainer}
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    >
      <Animated.View style={boxStyle}>
        {isGlass ? (
          <GlassView
            glassEffectStyle={{
              style: isGlassShown ? 'regular' : 'none',
              animate: true,
              animationDuration: bigLetterFadeMs / 1000,
            }}
            style={styles.bigLetterBox}
          >
            <Animated.View style={[StyleSheet.absoluteFill, lettersStyle]}>
              {letters.map((letter, i) => (
                <BigLetterGlyph key={i} letter={letter} index={i} section={section} />
              ))}
            </Animated.View>
          </GlassView>
        ) : (
          <SystemView
            shadow={false}
            // iOS blurs behind its translucent chrome; elsewhere it's solid, so it's made see-through here
            style={[styles.bigLetterBox, process.env.EXPO_OS !== 'ios' && { backgroundColor: withAlpha(chrome, 'CC') }]}
          >
            {letters.map((letter, i) => (
              <BigLetterGlyph key={i} letter={letter} index={i} section={section} />
            ))}
          </SystemView>
        )}
      </Animated.View>
    </View>
  );
}

function BigLetterGlyph({ letter, index, section }: { letter: string; index: number; section: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: section.get() === index ? 1 : 0 }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <ThemedText title bold allowFontScaling={false} style={[styles.bigLetter, { color: letterColor }]}>
        {letter}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  measurer: {
    position: 'absolute',
    top: 0,
    opacity: 0,
  },
  row: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: columnMaxWidth,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  // no taller than the space it has: after a resize, until the letters refit the new height (a render later, or
  // more while the list rebuilds its rows), the capsule clips them rather than running past the bars
  touchArea: {
    maxHeight: '100%',
    paddingLeft: leadingSlop,
  },
  capsule: {
    maxHeight: '100%',
    width: capsuleWidth,
    paddingVertical: capsulePadding,
    borderRadius: capsuleWidth / 2,
    overflow: 'hidden',
  },
  letter: {
    fontSize: 11,
    textAlign: 'center',
  },
  bigLetterContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigLetterBox: {
    width: bigLetterBoxSize,
    height: bigLetterBoxSize,
    borderRadius: 24,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  bigLetter: {
    fontSize: 56,
    lineHeight: bigLetterBoxSize,
    textAlign: 'center',
  },
});
