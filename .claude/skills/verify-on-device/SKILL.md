---
name: verify-on-device
description: Verify a Dainorėlis change on iOS simulators (27, 26, 18, iPad, iPhone Duo) and Android emulators before calling it done — build, drive, screenshot, record and compare. Use whenever a UI, layout, header, navigation, deep-link or platform-specific change needs to be seen working, or to reproduce a reported bug.
---

# Verify on device

Reproduce first, then fix, then look again on the same device. A change isn't done until you've seen it on
every platform it touches: iOS 27 (Liquid Glass), iOS 26, iOS 18 (the custom header path), iPad (narrow and wide
windows), and Android. Say plainly what you didn't verify and why.

## Ground rules

- **Never play audio.** Mute before touching a player; don't leave anything playing.
- **Never touch the owner's devices**: `emulator-5556` (their Pixel Fold) or any physical device, unless they
  hand one over. Always pass `adb -s <serial>` / `--udid <udid>`.
- **One agent per device.** When fanning out, give each agent its own simulator or AVD, and take the iOS build
  lock (`mkdir <scratchpad>/ios-build.lock`, `rmdir` after) around any `xcodebuild`.
- Install over the app freely; the owner's sim data isn't precious. Don't wipe real devices.

## Devices

- iOS sims: `xcrun simctl list devices available`. There are runtimes for 18.6, 26.5, 27.0 and 27.1 (iPhone
  Duo). "Shots iPhone 16" and "Shots iPad mini" belong to the store-screenshot pipeline
  (`scripts/store-screenshots/README.md`).
- Android AVDs: `Pixel_9a` (start with `-memory 6144`), `Shots_Pixel`. `Pixel_9_Pro_Fold` is the AVD behind the
  owner's Fold window — leave it alone.

## Builds

- Release builds avoid LogBox and Metro banners, and match what ships:
  - iOS sim: `xcodebuild -workspace ios/Dainorelis.xcworkspace -scheme Dainorelis -configuration Release -sdk iphonesimulator -derivedDataPath ios/build/dd`, then `xcrun simctl install <udid> ios/build/dd/Build/Products/Release-iphonesimulator/Dainorelis.app`.
  - Android: `cd android && ./gradlew :app:assembleRelease` (signed with the upload key in `~/.gradle`), then `adb -s <serial> install -r app/build/outputs/apk/release/app-release.apk`.
- Debug against Metro (`npx expo start`) is fine for fast iteration; dev builds are slow on older phones.
- Missing `ios/` or `android/`: `npx expo prebuild --clean --platform <p>` (syncs songs; `SKIP_SONG_SYNC=1` only for
  throwaway builds, never store builds).

## Driving iOS simulators

- `axe` (`brew install cameroncooke/axe/axe`) taps, swipes and types. Its quick `tap` doesn't register on Xcode 27
  sims; use a timed touch: `scripts/tap.sh <udid> <x> <y>` (points, not pixels).
- Find what to tap: `axe describe-ui --udid <udid> | python3 scripts/ui.py` lists controls with labels and centres.
- Deep links: `xcrun simctl openurl <udid> 'dainorelis://dainos/<id>'`. On a headless sim a cold open can hang
  (the "Open in…?" alert can't be driven): open the app first, and percent-encode non-ASCII (`ž` → `%C5%BE`).
- Screenshots: `xcrun simctl io <udid> screenshot out.png`. Clean status bar:
  `xcrun simctl status_bar <udid> override --time 9:41 --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3`.
- Appearance and text size: `xcrun simctl ui <udid> appearance dark|light`,
  `xcrun simctl ui <udid> content_size extra-extra-extra-large` (or `accessibility-extra-large` etc.).
- Animations and transitions: `xcrun simctl io <udid> recordVideo out.mov`, then tile frames with ffmpeg
  (`ffmpeg -i out.mov -vf fps=10,scale=300:-1,tile=6x3 tile.png`) to see a push, a scroll edge or a header
  collapse frame by frame.
- Compare before/after: `python3 scripts/pdiff.py a.png b.png [top]` prints the changed region's bounding box.
- The simulator has no lock-screen Now Playing; audio/lock-screen behaviour needs a real device (ask the owner).

## iPhone Duo (iOS 27.1)

- It boots **closed** (outer display, 1398×2034). `simctl` can't unfold it; only Device Hub (by hand) can.
- The inactive display screenshots black, and display IDs change on reboot: `scripts/duoshot.sh <udid> out.png`
  picks the live one. Screenshots can also be black for a few minutes after boot (Xcode 27.2 known issue).
- Taps don't reach the closed Duo. To get the app into a state (playlist, language), copy the app's MMKV file
  from another sim's data container instead of tapping.
- On the closed Duo, iOS moves the status bar and toolbar buttons to a rail down the trailing edge — expected.

## Driving Android emulators

- Start: `~/Library/Android/sdk/emulator/emulator -avd <avd> -memory 6144 &`, wait for
  `adb -s <serial> shell getprop sys.boot_completed` = 1. A "System isn't responding" dialog after boot: tap Wait.
- Find what to tap: `scripts/aui.sh <serial>` (uiautomator dump → labels and centres in px).
  Tap: `adb -s <serial> shell input tap <x> <y>`.
- Deep links: `adb -s <serial> shell am start -a android.intent.action.VIEW -d '<url>'`.
- Dark mode `adb shell cmd uimode night yes|no`; font scale `adb shell settings put system font_scale 1.3`
  (the app handles a font-size change without restarting, so test it live too).
- Clean status bar: `settings put global sysui_demo_allowed 1`, then `am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0941`
  (and `-e command exit` to leave demo mode).
- Screenshot `adb -s <serial> exec-out screencap -p > out.png`; record `adb -s <serial> shell screenrecord /sdcard/x.mp4`.

## Reporting

Show the owner what you saw: save screenshots or a contact sheet (ImageMagick `montage`) in the scratchpad and
give its full path, or open it with `open`. Name the device and OS for each check, and list what's still
unverified (real-device-only behaviour, the unfolded Duo, Bold Text, and so on).
