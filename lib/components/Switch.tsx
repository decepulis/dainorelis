import { Host, type SwitchProps, Switch as UISwitch } from '@expo/ui';

export default function Switch(props: SwitchProps) {
  return (
    <Host matchContents>
      <UISwitch {...props} />
    </Host>
  );
}
