import { ComponentPropsWithoutRef, type Ref, useState } from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';

type Props = ComponentPropsWithoutRef<typeof BorderlessButton> & {
  ref?: Ref<React.ComponentRef<typeof BorderlessButton>>;
};

export default function BorderlessButtonOpacity({ onActiveStateChange, ref, ...rest }: Props) {
  const [_, setWeirdIOSWorkAround] = useState(false);

  return (
    <BorderlessButton
      ref={ref}
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
