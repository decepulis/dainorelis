import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

export default function useIsAppVisible() {
  const [isAppVisible, setIsAppVisible] = useState<boolean>(() => AppState.currentState === 'active');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setIsAppVisible(nextAppState === 'active');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return isAppVisible;
}
