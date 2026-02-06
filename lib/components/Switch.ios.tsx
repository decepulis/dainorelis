import { Host as SwiftUIHost, Toggle as SwiftUIToggle, ToggleProps } from '@expo/ui/swift-ui';

type Props = Omit<ToggleProps, 'isOn' | 'onIsOnChange'> & {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
};

export default function Switch({ value, onValueChange, modifiers = [], ...props }: Props) {
  return (
    <SwiftUIHost matchContents>
      <SwiftUIToggle {...props} isOn={value} onIsOnChange={onValueChange} modifiers={[...modifiers]} />
    </SwiftUIHost>
  );
}
