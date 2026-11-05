/**
 * PROTOTYPE: the home screen's list as a SwiftUI List on iOS (lib/components/Index/NativeSongList.ios.tsx). On by
 * default on iOS; `EXPO_PUBLIC_NATIVE_SONG_LIST=0` brings back the React Native list, to compare.
 */
const nativeSongList = process.env.EXPO_OS === 'ios' && process.env.EXPO_PUBLIC_NATIVE_SONG_LIST !== '0';

export default nativeSongList;
