import { Platform } from 'react-native';

import * as Haptics from 'expo-haptics';

const { AndroidHaptics, ImpactFeedbackStyle } = Haptics;

/**
 * Each haptic the app plays: UIKit's feedback generator on iOS, and on Android the view's haptic feedback constant
 * (which follows the system's touch feedback setting, where impactAsync would run the vibrator), with an older
 * constant before the API level that added it (expo-haptics rejects a newer one).
 */
const feedback = {
  /** a song added to a playlist */
  on: { ios: () => Haptics.impactAsync(ImpactFeedbackStyle.Medium), android: AndroidHaptics.Toggle_On },
  /** a song removed from a playlist */
  off: { ios: () => Haptics.impactAsync(ImpactFeedbackStyle.Soft), android: AndroidHaptics.Toggle_Off },
  /** something done without a visible change, such as a playlist created with a song where the list stays put */
  confirm: { ios: () => Haptics.impactAsync(ImpactFeedbackStyle.Medium), android: AndroidHaptics.Confirm },
  /** a step through a series: a dragged row passing another, a letter in the jump-to-letter index */
  tick: { ios: () => Haptics.selectionAsync(), android: AndroidHaptics.Segment_Tick },
  /** a row lifting to be dragged */
  lift: { ios: () => Haptics.impactAsync(ImpactFeedbackStyle.Light), android: AndroidHaptics.Drag_Start },
  /** a gesture crossing the point where letting go acts: a full swipe arming */
  threshold: { ios: () => Haptics.impactAsync(ImpactFeedbackStyle.Light), android: AndroidHaptics.Segment_Tick },
  /** a dragged control reaching its end: the player's scrubber */
  edge: { ios: () => Haptics.impactAsync(ImpactFeedbackStyle.Medium), android: AndroidHaptics.Segment_Tick },
};

// the constants Android 11 (Confirm) and 14 (the rest) added, and what plays before them
const androidSince: Partial<Record<Haptics.AndroidHaptics, [number, Haptics.AndroidHaptics]>> = {
  [AndroidHaptics.Confirm]: [30, AndroidHaptics.Context_Click],
  [AndroidHaptics.Toggle_On]: [34, AndroidHaptics.Context_Click],
  [AndroidHaptics.Toggle_Off]: [34, AndroidHaptics.Clock_Tick],
  [AndroidHaptics.Segment_Tick]: [34, AndroidHaptics.Clock_Tick],
  [AndroidHaptics.Drag_Start]: [34, AndroidHaptics.Long_Press],
};

/**
 * Plays a haptic by what it means. None on web, where the browser's vibration isn't one. Module-level, so worklets
 * can hand it to scheduleOnRN.
 */
export default function haptic(kind: keyof typeof feedback) {
  if (process.env.EXPO_OS === 'ios') {
    feedback[kind].ios();
  } else if (process.env.EXPO_OS === 'android') {
    const type = feedback[kind].android;
    const [since, fallback] = androidSince[type] ?? [0, type];
    Haptics.performAndroidHapticsAsync((Platform.Version as number) >= since ? type : fallback);
  }
}
