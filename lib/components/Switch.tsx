import { Host, Switch as UISwitch } from '@expo/ui';
import { accessibilityLabel as a11yLabel, tint } from '@expo/ui/swift-ui/modifiers';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Screen-reader name; the visible label is rendered by the caller. */
  accessibilityLabel?: string;
};

export default function Switch({ value, onValueChange, accessibilityLabel }: Props) {
  // the brand green where it's on, as Android's switch track
  const primary = useThemeColor('primary');
  return (
    // the hosting view keeps its SwiftUI content out of the safe area, so as the switch scrolls under a bar it
    // would hold the switch below the bar instead of letting it scroll on with its row
    <Host matchContents ignoreSafeArea="all">
      <UISwitch
        value={value}
        onValueChange={onValueChange}
        modifiers={[tint(primary), ...(accessibilityLabel ? [a11yLabel(accessibilityLabel)] : [])]}
      />
    </Host>
  );
}
