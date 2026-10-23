import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  type AccessibilityActionEvent,
  DynamicColorIOS,
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
  useScrollOffset,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import { type SongListItem } from '@/lib/hooks/useSongList';
import haptic from '@/lib/utils/haptic';

import SystemView from '../SystemView';
import ThemedText from '../ThemedText';
import { ListHeader, ListItemContent } from './ListItem';

// each letter's height (and the index's width, for the thumb); larger text sizes grow them up to maxScale, then
// letters give way to dots
const letterHeight = 16;
const maxScale = 1.4;
export const sectionIndexWidth = 24;
// the capsule behind the letters, inset from the index's edges, and its padding above and below them
const capsuleInset = 2;
const capsulePadding = 5;
/** the trailing padding rows need beside the index, to keep their icons clear of its capsule */
export const sectionIndexRowPadding = sectionIndexWidth + Math.round(padding / 3);
// on Liquid Glass the letters take the label color, as the player's controls do; on the app's green surface, white
const letterColor = isLiquidGlassAvailable() ? DynamicColorIOS({ light: '#000000', dark: '#ffffff' }) : '#ffffff';

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
  listRef: AnimatedRef<Animated.FlatList<any>>;
  /** how far below the list's top a section's header lands: under the navigation bar */
  topInset: number;
  /** the list's content height and its own, so a jump near the end stops at the end */
  contentHeight: SharedValue<number>;
  listHeight: number;
  /** where the index sits over the list: top, bottom and right */
  style: ViewStyle;
};
/**
 * The jump-to-letter index at the list's trailing edge, as in Contacts: touching or dragging along it jumps to
 * that letter's section. Its letters sit on a capsule (Liquid Glass, or the app's other floating controls'
 * surface), so it shows over the forest as over the rows. Screen readers get one adjustable element, swiped up and
 * down a letter at a time.
 */
export default function SectionIndex({
  sections,
  listRef,
  topInset,
  contentHeight,
  listHeight,
  style,
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
  // y is from the capsule's top, above its padding
  const select = (y: number) => {
    'worklet';
    y -= capsulePadding;
    const section = Math.min(count - 1, Math.max(0, Math.floor((y / columnHeight) * count)));
    if (section === selected.get()) return;
    selected.set(section);
    target.set(section);
    scheduleOnRN(jumpToTarget, section);
    scheduleOnRN(haptic, 'tick');
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

  const Capsule = isLiquidGlassAvailable() ? GlassView : SystemView;

  return (
    <View
      style={[styles.container, style]}
      pointerEvents="box-none"
      onLayout={(e) => setAvailableHeight(e.nativeEvent.layout.height)}
    >
      {availableHeight > 0 ? (
        <GestureDetector gesture={gesture}>
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
        </GestureDetector>
      ) : null}
    </View>
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
  capsule: {
    marginHorizontal: capsuleInset,
    paddingVertical: capsulePadding,
    borderRadius: (sectionIndexWidth - capsuleInset * 2) / 2,
    overflow: 'hidden',
  },
  letter: {
    fontSize: 11,
    textAlign: 'center',
  },
});
