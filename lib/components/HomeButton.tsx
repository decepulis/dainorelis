import { Pressable } from 'react-native';

import { Link, router } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

export default function HomeButton() {
  const isPresented = router.canGoBack();

  return (
    <Link href={isPresented ? '../' : '/'} asChild>
      {/* TODO there's a better pressable out there */}
      <Pressable hitSlop={24} style={{ paddingHorizontal: 20, width: 60 }}>
        <FontAwesome6 name="chevron-left" size={20} color="white" />
      </Pressable>
    </Link>
  );
}
