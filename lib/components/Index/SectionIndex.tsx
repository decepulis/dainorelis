import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AccessibilityActionEvent,
  type LayoutChangeEvent,
  StyleSheet,
  View,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  type AnimatedRef,
  type SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useScrollOffset,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import * as Haptics from 'expo-haptics';

import maxWidth from '@/lib/constants/maxWidth';
import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import { type SongListItem } from '@/lib/hooks/useSongList';

import ThemedText from '../ThemedText';
import { ListHeader, ListItemContent } from './ListItem';

// each letter's height (and the index's width, for the thumb); larger text sizes grow them up to maxScale, then
// letters give way to dots
const letterHeight = 16;
const maxScale = 1.4;
export const sectionIndexWidth = 24;
// defined before the component: the gesture worklets capture it, and React Compiler may hoist them out of it
const selectionHaptic = () => Haptics.selectionAsync();

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
  /** every row's layout, once all are measured, and again whenever one changes (width, text size, a favourite) */
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
  listRef: AnimatedRef<Animated.FlatList<any>>;
  /** how far below the list's top a section's header lands: under the navigation bar */
  topInset: number;
  /** the list's content height and its own, so a jump near the end stops at the end */
  contentHeight: SharedValue<number>;
  listHeight: number;
  color: string;
  /** where the index sits over the list: top, bottom and right */
  style: ViewStyle;
};
/**
 * The jump-to-letter index at the list's trailing edge, as in Contacts: touching or dragging along it jumps to
 * that letter's section. Screen readers get one adjustable element, swiped up and down a letter at a time.
 */
export default function SectionIndex({
  sections,
  listRef,
  topInset,
  contentHeight,
  listHeight,
  color,
  style,
}: SectionIndexProps) {
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const { reduceMotion } = useAccessibilityInfo();
  const rowHeight = Math.round(letterHeight * Math.min(fontScale, maxScale));
  const [availableHeight, setAvailableHeight] = useState(0);

  // where each section's header is scrolled to, under the navigation bar
  const offsets = sections.map((section) => Math.max(0, section.offset - topInset));
  const count = sections.length;

  // short of room (landscape, the largest text sizes), every other row is a dot, standing for the letters
  // between its neighbours, as in iOS's own index
  const maxRows = Math.max(3, Math.floor(availableHeight / rowHeight));
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
  // it shows once the list reaches the navigation bar: over the forest above it, it would be lost. Screen readers
  // find it either way
  const [isShown, setIsShown] = useState(false);
  useAnimatedReaction(
    () => scrollOffset.get() >= offsets[0] - 1,
    (shown, wasShown) => {
      if (shown !== wasShown) scheduleOnRN(setIsShown, shown);
    }
  );
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scrollOffset.get() >= offsets[0] - 1 ? 1 : 0, { duration: 150, reduceMotion }),
  }));

  // scrolled from JS, where the list follows its scroll events to render the rows there
  const jumpTo = (section: number) => {
    if (section < 0 || section >= count) return;
    setCurrent(section);
    listRef.current?.scrollToOffset({
      offset: Math.min(offsets[section], Math.max(0, contentHeight.get() - listHeight)),
      animated: false,
    });
  };
  // the finger's section, while it's down, and the latest one it asked for: dragged fast, the JS thread can fall
  // behind, so it skips to the latest rather than through every section passed
  const selected = useSharedValue(-1);
  const target = useSharedValue(-1);
  const jumpToTarget = (section: number) => {
    if (section === target.get()) jumpTo(section);
  };
  const select = (y: number) => {
    'worklet';
    const section = Math.min(count - 1, Math.max(0, Math.floor((y / columnHeight) * count)));
    if (section === selected.get()) return;
    selected.set(section);
    target.set(section);
    scheduleOnRN(jumpToTarget, section);
    if (process.env.EXPO_OS === 'ios') scheduleOnRN(selectionHaptic);
  };
  const gesture = usePanGesture({
    minDistance: 0,
    onBegin: (e) => select(e.y),
    onUpdate: (e) => select(e.y),
    onFinalize: () => selected.set(-1),
  });

  const onAccessibilityAction = ({ nativeEvent: { actionName } }: AccessibilityActionEvent) => {
    if (actionName === 'increment') jumpTo(current + 1);
    else if (actionName === 'decrement') jumpTo(current - 1);
  };

  return (
    <Animated.View
      style={[styles.container, style, fadeStyle]}
      pointerEvents={isShown ? 'box-none' : 'none'}
      onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}
    >
      {availableHeight > 0 ? (
        <GestureDetector gesture={gesture}>
          <View
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={t('sectionIndex')}
            accessibilityValue={{ text: sections[current]?.letter }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={onAccessibilityAction}
            style={{ height: columnHeight }}
          >
            {rows.map((letter, i) => (
              <ThemedText
                key={i}
                title
                bold
                maxFontSizeMultiplier={maxScale}
                // the line height scales with the text, as rowHeight does
                style={[styles.letter, { color, height: rowHeight, lineHeight: letterHeight }]}
              >
                {letter}
              </ThemedText>
            ))}
          </View>
        </GestureDetector>
      ) : null}
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
    width: sectionIndexWidth,
    justifyContent: 'center',
  },
  letter: {
    fontSize: 11,
    textAlign: 'center',
  },
});
