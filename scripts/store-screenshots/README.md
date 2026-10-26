# Store screenshots

`assets/images/screenshots/{iOS,iPadOS,iPhone Duo,Android} {1-5}.png` are composed from raw captures by
`compose.ts`: a caption in Saira Semi Condensed on eglė, over the capture in a device frame.
`config.json` holds the captions, the frames (an image with a transparent screen, or a plain drawn
bezel), and each store target's canvas size, frame and layout.

1. Take the captures below into `captures/<target>/<n>.png` (gitignored).
2. `pnpm store-screenshots` (or `pnpm store-screenshots iOS` for one target).

To change the words or the screens, edit `shots` in `config.json` and the list below. A new frame is
an entry in `frames`. The capture is stretched to fill its `screen`, so take it at that size, or at least
in that aspect.

`_iPhone Duo.png` is Apple's iPhone Duo product bezel, "iPhone Duo - Star White - Outer Closed Portrait.png"
from `Bezel-iPhone-Duo.dmg` (developer.apple.com/design/resources, Product Bezels), unaltered (Apple's
guidelines don't allow recolouring its product images; Night Sky's blue clashed with eglė), with its screen at
[88, 80, 1398, 2034]. The screen's right-hand corners are rounder than the device's outline there, so the frame
sets `clip`, which cuts the capture to the screen hole and keeps its square corners from showing outside the
bezel. The kit also has Night Sky, landscape and the open (inner, 2007×2853 screen) display bezels.

## Devices

| Target     | Device (capture size)                                             | Store size             |
| ---------- | ----------------------------------------------------------------- | ---------------------- |
| iOS        | iPhone 16 simulator (1179×2556)                                   | 1206×2622 (6.3")       |
| iPadOS     | iPad mini (A17 Pro) simulator (1488×2266)                         | 2048×2732 (12.9"/13")  |
| Android    | Pixel 9a emulator (1080×2424)                                     | 1080×1920              |
| iPhone Duo | iPhone Duo simulator, iOS 27.1, closed (outer display, 1398×2034) | 1398×2034 (Duo, outer) |

To recreate the devices (iOS 27.0 runtime, Android 36 Play Store image):

```bash
xcrun simctl create "Shots iPhone 16" com.apple.CoreSimulator.SimDeviceType.iPhone-16 com.apple.CoreSimulator.SimRuntime.iOS-27-0
xcrun simctl create "Shots iPad mini" com.apple.CoreSimulator.SimDeviceType.iPad-mini-A17-Pro com.apple.CoreSimulator.SimRuntime.iOS-27-0
xcrun simctl boot <udid>   # each; create prints the udid
# Debug simulator build, then install it on each sim:
xcodebuild -workspace ios/Dainorelis.xcworkspace -scheme Dainorelis -configuration Debug \
  -sdk iphonesimulator -derivedDataPath ios/build/dd
xcrun simctl install <udid> ios/build/dd/Build/Products/Debug-iphonesimulator/Dainorelis.app

sdkmanager "system-images;android-36;google_apis_playstore;arm64-v8a"
avdmanager create avd -n Shots_Pixel -d pixel_9a \
  -k "system-images;android-36;google_apis_playstore;arm64-v8a"
emulator -avd Shots_Pixel &       # comes up as emulator-5554 if it's the first one
npx expo run:android --device emulator-5554   # or adb -s emulator-5554 install <debug apk>
```

Run a Debug build against Metro. `capture.sh` wraps the device commands:

```bash
S=scripts/store-screenshots/capture.sh
$S prep ios <udid>                    # 9:41, full bars and battery
$S prep android emulator-5554         # demo mode (once per boot)
$S open ios <udid> 'dainorelis://dainos/rec9WsC1vTljkFQLf'
$S shot ios <udid> iOS 3              # -> captures/iOS/3.png
```

The Duo slot also takes the open (inner) display at 2007×2853, but the simulator boots closed and
neither `simctl` nor scripting can unfold it (Device Hub can, by hand). Take Duo captures with
`xcrun simctl io <udid> screenshot --display=1` (the outer display). Taps (AXe) don't reach the
closed Duo either, so shots 2 and 5 copy the app's MMKV files (`Documents/mmkv/mmkv.default` and
`.crc`) over from the iPhone after its shots, with the app terminated: shot 2 needs Laužas added
and selected in Lithuanian, shot 5 English.

## Shots

Start from a fresh install (`xcrun simctl uninstall`/`install`, `adb shell pm clear com.dainorelis.dainorelis`),
light appearance, app language Lietuvių, theme Automatic. Never start a recording. Before each shot,
check for Debug-only overlays: a LogBox toast (tap its ×) or Metro's "Refreshing…" banner (wait).
Open each link from the home screen, so the song's back button has no label.

1. **Library**: the home screen at the top of Visos dainos, right after launch.
2. **Playlists**: open
   `dainorelis://p?n=Laužas&s=LfWPkphr2Ka7J8,w8VCo1GWSthWu4,Hvjuje2YfRDz8R,C2I4Tj708Pjntx,6HvvXoUR16TDE4,vASIqN6m0kgQCX,HjN2O3VBBqwJ4r,Ak1k2DIAQbdpOK`
   (song ids without their `rec` prefix; iOS asks to open it first) and tap Pridėti grojaraštį once. Home now shows Laužas; scroll to the top.
3. **Song**: Atgimė tėvynė, `dainorelis://dainos/rec9WsC1vTljkFQLf`.
4. **Sheet music**: Buvo dūda Vilniuj's score,
   `dainorelis://dainos/receJQKQusXDipRUE?v=recwFVAEl2LEMwsy3`. Wait for the PDF to render.
5. **Language and dark mode**: Settings (the ⓘ button) → Kalba → English, then dark appearance
   (`xcrun simctl ui <udid> appearance dark`, `adb shell cmd uimode night yes`), relaunch the app
   and open shot 3's link. Afterwards set them back.
