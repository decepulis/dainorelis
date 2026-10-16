import { Host, Switch as UISwitch } from '@expo/ui';
import { accessibilityLabel as a11yLabel } from '@expo/ui/swift-ui/modifiers';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Screen-reader name; the visible label is rendered by the caller. */
  accessibilityLabel?: string;
};

export default function Switch({ value, onValueChange, accessibilityLabel }: Props) {
  return (
    <Host matchContents>
      <UISwitch
        value={value}
        onValueChange={onValueChange}
        modifiers={process.env.EXPO_OS === 'ios' && accessibilityLabel ? [a11yLabel(accessibilityLabel)] : undefined}
      />
    </Host>
  );
}
