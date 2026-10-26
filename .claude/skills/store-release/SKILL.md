---
name: store-release
description: Ship a Dainorėlis version to the App Store and Google Play — release builds, store checks, screenshots and the submission walkthrough with the owner. Use when the owner says they're ready to release, asks for store/release builds, or asks what's left before publishing.
---

# Store release

The owner clicks the store buttons (App Store Connect, Play Console, Organizer uploads, Vercel/DNS dashboards); you
build, check and say exactly what to click, one step at a time, and wait for "done" before the next.
Never upload an iOS build for external testers yourself (`testFlightInternalTestingOnly` uploads "just for me"
are fine when asked).

## 1. Builds (start them first, in the background)

1. Bump `buildToday` in `app.config.ts` if a build already went up today; the build number is `yymmdd` + it.
   The version (`package.json`) is marketing-based: the owner picks it. Commit and push.
2. **Check Xcode is a final release**, not a beta or RC: compare `xcodebuild -version` (build number) with
   https://developer.apple.com/news/releases/. App Store Connect rejects beta-built archives, and an RC isn't worth
   the risk. The App Store copy of Xcode is always a final release.
3. iOS: `npx expo prebuild --clean --platform ios` (syncs songs; must not use `SKIP_SONG_SYNC`), then archive into
   Organizer: `xcodebuild archive -workspace ios/Dainorelis.xcworkspace -scheme Dainorelis -configuration Release -destination 'generic/platform=iOS' -archivePath "$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/Dainorelis <version> (<build>).xcarchive" -allowProvisioningUpdates DEVELOPMENT_TEAM=5BPU37MJR9`.
   Check the archive's `Info.plist`: `DTXcodeBuild`, `DTSDKName`, `CFBundleVersion`.
4. Android: `npx expo prebuild --clean --platform android`, `cd android && ./gradlew bundleRelease`. Copy the `.aab`
   somewhere that survives the next prebuild. Commit any song data the syncs changed.
5. Check the `.aab` before Play does: `targetSdkVersion` meets Play's current minimum (merged manifest under
   `android/app/build/intermediates/merged_manifest/release/`), every 64-bit `.so` is 16 KB-aligned (ELF `PT_LOAD`
   `p_align` ≥ 0x4000), it's signed with the upload key (`keytool -printcert -jarfile`), and the App Links
   `autoVerify` hosts match `public/.well-known/assetlinks.json`.

## 2. Website before apps

Universal links and App Links only verify once `https://dainorelis.app/.well-known/*` is served with a 200 and no
redirect, so the site ships first (Vercel deploys `main`). Check with curl: the AASA (`application/json`),
`assetlinks.json` (upload key + Play signing key), `/qr` per user agent, `/p?…`, a `/dainos/<id>` page, `/privacy`,
and the old `dainorelisapp.com` 308s keeping path and query.

## 3. Store listings

- Screenshots: `scripts/store-screenshots/README.md` (retake with a subagent on the Shots devices; the owner
  approves a contact sheet before upload). App Store Connect's iPhone slot is the medium display (1206×2622) plus
  an iPhone Duo slot (closed 1398×2034); iPad 13" takes 2048×2732. No alpha channel. Apple's product bezels
  (developer.apple.com/design/resources) may be scaled but never recoloured.
- Creatives: `assets/brand/store/` — Play icon and feature graphic, App Store product page header and search
  creative (`pnpm brand-assets`).
- Release notes in the owner's voice, EN and LT (formal _jūs_, check the Lithuanian); Play's limit is 500
  characters per language.
- URLs: Marketing/Support `https://dainorelis.app`, privacy `https://dainorelis.app/privacy`.

## 4. Declarations and review details

- Play → Policy and programs → App content: the foreground service is expo-audio's `mediaPlayback`
  (`AudioControlsService`); the declaration needs a short screen recording (MP4 — YouTube rejects WebM; convert
  with ffmpeg) of playing, backgrounding and pausing from the notification.
- App Store Connect: export compliance is answered by `usesNonExemptEncryption: false`; App Privacy is "Data Not
  Collected"; review notes say no account is needed and where the new features are; choose **Manually release**
  when the site or anything else must go first.

## 5. Submit, then after release

Play: production release → Send for review. iOS: Organizer → Distribute → App Store Connect → Upload, select the
build on the version page, Add for Review. Afterwards: Play Console → Deep links shows `dainorelis.app` verified,
tag the version, close the milestone, and file anything left as issues on the next milestone.
