import { Host as SwiftUIHost, Switch as SwiftUISwitch, SwitchProps } from '@expo/ui/swift-ui';

import { useThemeColor } from '../hooks/useThemeColor';

export default function Switch({ modifiers = [], ...props }: SwitchProps) {
  const primary = useThemeColor('primary');
  return (
    <SwiftUIHost matchContents>
      <SwiftUISwitch {...props} modifiers={[...modifiers]} color={primary} variant="switch" />
    </SwiftUIHost>
  );
}
