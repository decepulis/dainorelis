import { Switch as ComposeSwitch, Host } from '@expo/ui/jetpack-compose';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';

import { useThemeColor } from '../hooks/useThemeColor';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Screen-reader name; the visible label is rendered by the caller. */
  accessibilityLabel?: string;
};

/**
 * The universal @expo/ui Switch has no color props, so Android uses the Compose Switch directly
 * to keep the brand colors.
 */
export default function Switch({ value, onValueChange, accessibilityLabel }: Props) {
  const card = useThemeColor('card');
  const primary = useThemeColor('primary');
  return (
    <Host matchContents>
      <ComposeSwitch
        value={value}
        onCheckedChange={onValueChange}
        colors={{
          checkedThumbColor: card,
          checkedTrackColor: primary,
          uncheckedThumbColor: primary,
          uncheckedTrackColor: card,
          uncheckedBorderColor: primary,
        }}
        modifiers={accessibilityLabel ? [semantics({ contentDescription: accessibilityLabel })] : undefined}
      />
    </Host>
  );
}
