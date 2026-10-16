import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

type State = {
  isBoldTextEnabled: boolean;
  isHighTextContrastEnabled: boolean; // Android
  isDarkerSystemColorsEnabled: boolean; // iOS "Increase Contrast"
};

// One store for the whole app: every ThemedText (hundreds on a chorded song) reads it, so the native
// queries and change listeners run once, not once per component.
let state: State = {
  isBoldTextEnabled: false,
  isHighTextContrastEnabled: false,
  isDarkerSystemColorsEnabled: false,
};
const listeners = new Set<() => void>();

const setKey = (key: keyof State) => (value: boolean) => {
  if (state[key] === value) return;
  state = { ...state, [key]: value };
  listeners.forEach((listener) => listener());
};

// started on the first subscription (i.e. on the client, after the first render) and kept for the
// app's lifetime
let didStart = false;
function start() {
  if (didStart) return;
  didStart = true;

  const sources = [
    ['isBoldTextEnabled', () => AccessibilityInfo.isBoldTextEnabled(), 'boldTextChanged'],
    ['isHighTextContrastEnabled', () => AccessibilityInfo.isHighTextContrastEnabled(), 'highTextContrastChanged'],
    ['isDarkerSystemColorsEnabled', () => AccessibilityInfo.isDarkerSystemColorsEnabled(), 'darkerSystemColorsChanged'],
  ] as const;
  for (const [key, query, event] of sources) {
    const set = setKey(key);
    try {
      // listen first, so a change during the initial query isn't lost
      AccessibilityInfo.addEventListener(event, set);
      query()
        .then(set)
        .catch(() => {});
    } catch {
      // not implemented on this platform (react-native-web only has some of these): keep false
    }
  }
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

export default function useAccessibilityInfo() {
  const { isBoldTextEnabled, isHighTextContrastEnabled, isDarkerSystemColorsEnabled } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  // for reduce motion, use reanimated's useReducedMotion() (its springs already follow it)
  return {
    isBoldTextEnabled,
    isHighContrastEnabled: isHighTextContrastEnabled || isDarkerSystemColorsEnabled,
    isDarkerSystemColorsEnabled,
  };
}
