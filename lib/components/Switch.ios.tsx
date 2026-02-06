import { Host as SwiftUIHost, Toggle as SwiftUIToggle, ToggleProps } from '@expo/ui/swift-ui';

export default function Switch({ modifiers = [], ...props }: ToggleProps) {
  return (
    <SwiftUIHost matchContents>
      <SwiftUIToggle {...props} modifiers={[...modifiers]} />
    </SwiftUIHost>
  );
}
