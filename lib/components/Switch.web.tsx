import { Switch as RNSwitch } from 'react-native';

import { useThemeColor } from '@/lib/hooks/useThemeColor';

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
};

/** @expo/ui's switch needs its native module, so web has react-native-web's */
export default function Switch({ value, onValueChange, accessibilityLabel }: Props) {
  const primary = useThemeColor('primary');
  const separator = useThemeColor('separator');
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: separator, true: primary }}
      thumbColor="#fff"
    />
  );
}
