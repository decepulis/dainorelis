import { ComponentPropsWithoutRef, useState } from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';

export default function BorderlessButtonOpacity({
  onActiveStateChange,
  ...rest
}: ComponentPropsWithoutRef<typeof BorderlessButton>) {
  const [_, setWeirdIOSWorkAround] = useState(false);

  return (
    <BorderlessButton
      activeOpacity={0.8}
      onActiveStateChange={(a) => {
        // weird bug. activeOpacity doesn't work unless I keep some sort of local state like this
        setWeirdIOSWorkAround(a);
        onActiveStateChange?.(a);
      }}
      {...rest}
    />
  );
}
