import { Fragment, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { MenuAction, MenuComponentProps } from '@expo/ui/community/menu';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import padding from '@/lib/constants/padding';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

import { buttonSlop } from './Button';
import ThemedText from './ThemedText';

export type { MenuAction } from '@expo/ui/community/menu';

type Props = {
  hitSlop?: Partial<{ top: number; bottom: number; left: number; right: number }>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
} & Omit<MenuComponentProps, 'colorScheme'>;

const menuWidth = 260;
const rowHeight = 44;
const destructive = 'rgb(255, 69, 58)';

/**
 * @expo/ui's menu only renders its trigger on web, so this is a popover of the same actions: below the trigger
 * (above it when there's no room), closed by a click outside or Escape. Submenus open in place.
 */
export default function MenuView({
  hitSlop: argHitSlop,
  children,
  style,
  actions,
  title,
  onPressAction,
  onOpenMenu,
  onCloseMenu,
  shouldOpenOnLongPress,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: Props) {
  const hitSlop = { ...buttonSlop, ...argHitSlop };
  const trigger = useRef<React.ComponentRef<typeof Pressable>>(null);
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const { width, height } = useWindowDimensions();
  const card = useThemeColor('card');
  const text = useThemeColor('text');
  const separator = useThemeColor('separator');

  const open = () => {
    setAnchor((trigger.current as unknown as HTMLElement).getBoundingClientRect());
    setOpenSubmenus([]);
    onOpenMenu?.();
  };
  const close = () => {
    setAnchor(null);
    onCloseMenu?.();
  };

  useEffect(() => {
    if (!anchor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAnchor(null);
        onCloseMenu?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [anchor, onCloseMenu]);

  const select = (action: MenuAction) => {
    close();
    onPressAction?.({ nativeEvent: { event: action.id ?? action.title } });
  };

  const renderActions = (list: MenuAction[], depth = 0): React.ReactNode =>
    list
      .filter((action) => !action.attributes?.hidden)
      .map((action, index) => {
        const id = action.id ?? action.title;
        if (action.subactions && action.displayInline) {
          // a section, set off by separators
          return (
            <View
              key={id}
              style={[
                index > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: separator } : null,
                index < list.length - 1
                  ? { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: separator }
                  : null,
              ]}
            >
              {action.title ? <ThemedText style={styles.sectionTitle}>{action.title}</ThemedText> : null}
              {renderActions(action.subactions, depth)}
            </View>
          );
        }
        const isSubmenu = !!action.subactions;
        const isOpen = openSubmenus.includes(id);
        const disabled = !!action.attributes?.disabled;
        const color = action.attributes?.destructive ? destructive : text;
        return (
          <Fragment key={id}>
            <Pressable
              role="menuitem"
              aria-checked={action.state ? action.state === 'on' : undefined}
              aria-expanded={isSubmenu ? isOpen : undefined}
              disabled={disabled}
              onPress={() =>
                isSubmenu
                  ? setOpenSubmenus(isOpen ? openSubmenus.filter((s) => s !== id) : [...openSubmenus, id])
                  : select(action)
              }
              // react-native-web adds `hovered` (for a mouse; a tap doesn't leave it behind)
              style={(state) => [
                styles.row,
                { paddingLeft: padding * (0.75 + depth), opacity: disabled ? 0.4 : 1 },
                state.pressed || (state as { hovered?: boolean }).hovered ? { backgroundColor: separator } : null,
              ]}
            >
              <View style={styles.check}>
                {action.state === 'on' ? <FontAwesome6 name="check" iconStyle="solid" size={14} color={color} /> : null}
              </View>
              <ThemedText numberOfLines={2} style={[styles.rowTitle, { color }]}>
                {action.title}
              </ThemedText>
              {isSubmenu ? (
                <FontAwesome6 name={isOpen ? 'chevron-up' : 'chevron-down'} iconStyle="solid" size={12} color={text} />
              ) : null}
            </Pressable>
            {isSubmenu && isOpen ? renderActions(action.subactions!, depth + 1) : null}
          </Fragment>
        );
      });

  // below the trigger, or above it when there's more room there; kept inside the window
  const spaceBelow = anchor ? height - anchor.bottom - padding : 0;
  const spaceAbove = anchor ? anchor.top - padding : 0;
  const below = spaceBelow >= Math.min(rowHeight * 5, spaceAbove);
  const left = anchor ? Math.max(padding / 2, Math.min(anchor.left, width - menuWidth - padding / 2)) : 0;

  return (
    <View
      style={{
        marginLeft: -hitSlop.left,
        marginRight: -hitSlop.right,
        marginTop: -hitSlop.top,
        marginBottom: -hitSlop.bottom,
      }}
    >
      <Pressable
        ref={trigger}
        testID={testID}
        role="button"
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={shouldOpenOnLongPress ? undefined : open}
        onLongPress={shouldOpenOnLongPress ? open : undefined}
        style={({ pressed }) => [
          {
            paddingLeft: hitSlop.left,
            paddingRight: hitSlop.right,
            paddingTop: hitSlop.top,
            paddingBottom: hitSlop.bottom,
            opacity: anchor || pressed ? 0.5 : 1,
          },
          style,
        ]}
      >
        {children}
      </Pressable>
      <Modal transparent visible={!!anchor} onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="" focusable={false} />
        {anchor ? (
          <View
            role="menu"
            style={[
              styles.menu,
              {
                backgroundColor: card,
                left,
                maxHeight: Math.max(below ? spaceBelow : spaceAbove, rowHeight * 3),
              },
              below ? { top: anchor.bottom + padding / 4 } : { bottom: height - anchor.top + padding / 4 },
            ]}
          >
            <ScrollView>
              {title ? <ThemedText style={styles.sectionTitle}>{title}</ThemedText> : null}
              {renderActions(actions)}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: menuWidth,
    paddingVertical: padding / 4,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
  },
  row: {
    minHeight: rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: padding * 0.75,
    gap: padding / 2,
    cursor: 'pointer',
  },
  check: {
    width: 14,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 13,
    opacity: 0.6,
    paddingHorizontal: padding * 0.75,
    paddingTop: padding / 2,
    paddingBottom: padding / 4,
  },
});
