import { Switch as JetpackSwitch, SwitchProps } from '@expo/ui/jetpack-compose';

import { useThemeColor } from '../hooks/useThemeColor';

export default function Switch({ style, elementColors, modifiers = [], ...props }: SwitchProps) {
  const text = useThemeColor('text');
  const card = useThemeColor('card');
  const primary = useThemeColor('primary');
  return (
    <JetpackSwitch
      variant="switch"
      elementColors={{
        checkedThumbColor: card,
        checkedTrackColor: primary,
        uncheckedThumbColor: primary,
        uncheckedTrackColor: card,
        ...elementColors,
      }}
      modifiers={[...modifiers]}
      style={[style]}
      {...props}
    />
  );
}
