import { Host, Switch as UISwitch, type SwitchProps } from '@expo/ui';

export default function Switch(props: SwitchProps) {
  return (
    <Host matchContents>
      <UISwitch {...props} />
    </Host>
  );
}
