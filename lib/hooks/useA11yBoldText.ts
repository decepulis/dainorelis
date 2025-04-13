import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export default function useA11yBoldText() {
  const [boldTextEnabled, setBoldTextEnabled] = useState(false);
  useEffect(() => {
    // get initial state
    // TODO block rendering until this is done?
    const getBoldTextEnabled = async () => {
      const isBoldTextEnabled = await AccessibilityInfo.isBoldTextEnabled();
      setBoldTextEnabled(isBoldTextEnabled);
    };
    getBoldTextEnabled();

    // listen for changes
    const boldTextChangedSubscription = AccessibilityInfo.addEventListener('boldTextChanged', (isBoldTextEnabled) => {
      setBoldTextEnabled(isBoldTextEnabled);
    });
    return () => {
      boldTextChangedSubscription.remove();
    };
  }, []);
  return boldTextEnabled;
}
