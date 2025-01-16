import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

import { Link, router } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

const AnimatedFontAwesome6 = Animated.createAnimatedComponent(FontAwesome6);

export default function HomeButton({ color = '#fff', timing = { duration: 0 } }) {
  const isPresented = router.canGoBack();
  const sv = useSharedValue(color);

  useEffect(() => {
    sv.value = color;
  }, [color, sv]);

  const animatedProps = useAnimatedProps(() => ({
    color: withTiming(sv.value, timing),
  }));

  return (
    <Link href={isPresented ? '../' : '/'} asChild>
      {/* TODO there's a better pressable out there */}
      <Pressable hitSlop={24} style={{ paddingHorizontal: 20, width: 60 }}>
        <AnimatedFontAwesome6 name="chevron-left" size={20} animatedProps={animatedProps} />
      </Pressable>
    </Link>
  );
}
