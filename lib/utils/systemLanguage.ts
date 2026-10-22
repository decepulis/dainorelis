import { Settings } from 'react-native';

/**
 * iOS localizes system-provided UI (SwiftUI List edit mode, share sheets, system alert buttons) in the app's
 * preferred localization, which it picks at launch from the app's `AppleLanguages` default, falling back to the
 * device languages. Mirror the in-app language there so system UI matches it, from the next launch on. It's the
 * same default iOS's own per-app language setting (Settings › Dainorėlis › Language) writes; the in-app setting
 * wins, since it's written again on every launch.
 */
export function setSystemLanguage(language: string) {
  if (process.env.EXPO_OS !== 'ios') return;
  if (language !== 'lt' && language !== 'en') return;
  const current = Settings.get('AppleLanguages');
  if (Array.isArray(current) && current.length === 1 && current[0] === language) return;
  Settings.set({ AppleLanguages: [language] });
}
