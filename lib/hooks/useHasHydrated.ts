import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` while React hydrates a statically rendered web page, `true` afterwards (and always on native). For what
 * the server can't render, or can't know: the browser's storage, color scheme and audio.
 */
export default function useHasHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
