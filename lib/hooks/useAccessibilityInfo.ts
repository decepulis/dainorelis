import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export default function useAccessibilityInfo() {
  const [isBoldTextEnabled, setIsBoldTextEnabled] = useState(false);
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false);
  const [isHighTextContrastEnabled, setIsHighTextContrastEnabled] = useState(false);
  const [isDarkerSystemColorsEnabled, setIsDarkerSystemColorsEnabled] = useState(false); // increase contrast
  const [isReduceTransparencyEnabled, setIsReduceTransparencyEnabled] = useState(false); // reduce transparency

  const isHighContrastEnabled = isHighTextContrastEnabled || isDarkerSystemColorsEnabled;

  useEffect(() => {
    // get initial state
    AccessibilityInfo.isBoldTextEnabled().then(setIsBoldTextEnabled);
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotionEnabled);
    AccessibilityInfo.isHighTextContrastEnabled().then(setIsHighTextContrastEnabled);
    AccessibilityInfo.isDarkerSystemColorsEnabled().then(setIsDarkerSystemColorsEnabled);
    AccessibilityInfo.isReduceTransparencyEnabled().then(setIsReduceTransparencyEnabled);

    // listen for changes
    const boldTextChangedSubscription = AccessibilityInfo.addEventListener('boldTextChanged', setIsBoldTextEnabled);
    const reduceMotionChangedSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setIsReduceMotionEnabled
    );
    const highTextContrastChangedSubscription = AccessibilityInfo.addEventListener(
      'highTextContrastChanged',
      setIsHighTextContrastEnabled
    );
    const darkerSystemColorsChangedSubscription = AccessibilityInfo.addEventListener(
      'darkerSystemColorsChanged',
      setIsDarkerSystemColorsEnabled
    );
    const reduceTransparencyChangedSubscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setIsReduceTransparencyEnabled
    );

    // clean up
    return () => {
      boldTextChangedSubscription.remove();
      reduceMotionChangedSubscription.remove();
      highTextContrastChangedSubscription.remove();
      darkerSystemColorsChangedSubscription.remove();
      reduceTransparencyChangedSubscription.remove();
    };
  }, []);

  return {
    isBoldTextEnabled,
    isReduceMotionEnabled,
    isHighContrastEnabled,
    isDarkerSystemColorsEnabled,
    isReduceTransparencyEnabled,
  };
}
