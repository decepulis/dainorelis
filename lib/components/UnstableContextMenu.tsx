import { StyleProp, ViewStyle } from 'react-native';

export type ContextMenuAction = {
  id: string;
  title: string;
  image?: string; // SF Symbol (iOS) or drawable name (Android)
  onPress?: () => void;
  disabled?: boolean;
  state?: 'on' | 'off'; // For checkmarks/selection
};

export type ContextMenuProps = {
  actions: ContextMenuAction[];
  title?: string; // Android only
  children: React.ReactNode; // The trigger element
  hitSlop?: Partial<{ top: number; bottom: number; left: number; right: number }>;
  style?: StyleProp<ViewStyle>;
};

export default function ContextMenu(_props: ContextMenuProps) {
  return null; // not implemented for web
}
