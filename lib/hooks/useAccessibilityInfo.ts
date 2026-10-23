import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';
import { ReduceMotion } from 'react-native-reanimated';

type State = {
  isBoldTextEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isHighTextContrastEnabled: boolean; // Android
  isDarkerSystemColorsEnabled: boolean; // iOS "Increase Contrast"
};

// One store for the whole app: every ThemedText (hundreds on a chorded song) reads it, so the native
// queries and change listeners run once, not once per component. The listeners stay registered, so
// every value follows the system setting live while the app runs.
let state: State = {
  isBoldTextEnabled: false,
  isReduceMotionEnabled: false,
  isHighTextContrastEnabled: false,
  isDarkerSystemColorsEnabled: false,
};
const listeners = new Set<() => void>();

const setKey = (key: keyof State, value: boolean) => {
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
    ['isReduceMotionEnabled', () => AccessibilityInfo.isReduceMotionEnabled(), 'reduceMotionChanged'],
    ['isHighTextContrastEnabled', () => AccessibilityInfo.isHighTextContrastEnabled(), 'highTextContrastChanged'],
    ['isDarkerSystemColorsEnabled', () => AccessibilityInfo.isDarkerSystemColorsEnabled(), 'darkerSystemColorsChanged'],
  ] as const;
  for (const [key, query, event] of sources) {
    // listen first, so a change during the initial query isn't lost; once an event has arrived, the
    // (possibly older) query answer is ignored
    let didChange = false;
    try {
      AccessibilityInfo.addEventListener(event, (value: boolean) => {
        didChange = true;
        setKey(key, value);
      });
      query()
        .then((value) => {
          if (!didChange) setKey(key, value);
        })
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
  const { isBoldTextEnabled, isReduceMotionEnabled, isHighTextContrastEnabled, isDarkerSystemColorsEnabled } =
    useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    isBoldTextEnabled,
    isReduceMotionEnabled,
    /**
     * Pass as `reduceMotion` in every reanimated animation config. Reanimated's own default,
     * ReduceMotion.System, and its useReducedMotion() read the setting once at launch, so they miss a
     * change made while the app is open; this follows it live.
     */
    reduceMotion: isReduceMotionEnabled ? ReduceMotion.Always : ReduceMotion.Never,
    isHighContrastEnabled: isHighTextContrastEnabled || isDarkerSystemColorsEnabled,
  };
}
