// Space between a floating bottom control (the home screen's bottom bar, the player) and the bottom
// safe area inset. iOS's home indicator inset already leaves room above the indicator, so nothing is
// added there. Android's navigation bar inset is the bar itself (the buttons, or the gesture handle's
// strip) and is 0 in landscape, where 3-button navigation moves to the side, so keep Material 3's
// 16dp FAB margin above it.
const floatingBottomGap = process.env.EXPO_OS === 'android' ? 16 : 0;
export default floatingBottomGap;
