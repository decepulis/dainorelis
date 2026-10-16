# Dainorėlis

This is an [Expo](https://expo.dev) project. As best as I understand it, Expo is a framework to make everything about developing with [React Native](https://reactnative.dev/) easier. This project was created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

### Requirements

- **Node.js 22.13+ or 24.3+** (what Expo SDK 58 and React Native 0.88 require).
- **pnpm 10.x.** The lockfile only installs with pnpm 10: pnpm 9 fails with
  `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`, and a plain `npm i -g pnpm` now gets a newer major.
  Install it with `npm i -g pnpm@10` or `corepack prepare pnpm@10 --activate`. (There is
  deliberately no `packageManager` field; Vercel's handling of it broke the deployments.)

### Install dependencies

```bash
pnpm install
```

This is a pnpm workspace: the root is the Expo app, `admin/` is the CMS (see `admin/README.md`)
and `dainorelisapp.com/` is the marketing site. To refresh the bundled song data, copy
`.env.example` to `.env`, fill in `ADMIN_EXPORT_TOKEN`, and run `pnpm update-songs`.

### Start the app

```bash
pnpm dev:web
pnpm dev:ios
pnpm dev:android
```

For Android and iOS to work, you'll probably have to do some setup. Here's some reading to get you started:

- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/).

### Run a production build locally

If you don't want to deal with the Test Flight or Google Play Console to test a production build on your own device, try this:

```
# Android
npx expo run:android --variant release --device

# iOS
npx expo run:ios --configuration Release --device
```

Note that `plugins/withIosReleaseScheme.js` sets the Xcode scheme's Run action to Release, so
Run in Xcode also builds Release.

#### Android release signing

`plugins/withAndroidReleaseSigning.js` makes the release build type use an upload keystore read
from Gradle properties. Without them the release build is unsigned and can't be installed. Put
them in `~/.gradle/gradle.properties` (not the committed `android/gradle.properties`, which
prebuild regenerates):

```properties
MYAPP_UPLOAD_STORE_FILE=/absolute/path/to/upload-key.keystore
MYAPP_UPLOAD_STORE_PASSWORD=...
MYAPP_UPLOAD_KEY_ALIAS=...
MYAPP_UPLOAD_KEY_PASSWORD=...
```

A relative `MYAPP_UPLOAD_STORE_FILE` resolves against `android/app/`. Keystores are gitignored.

### Release

If you _do_ want to deal with TestFlight or Google Play Console to test a production build on your device (or other peoples' devices)... or if you're just ready to release a new version of the app, check this out:

- [Create a production build locally](https://docs.expo.dev/guides/local-app-production/)

**Run `npx expo prebuild --clean` right before every store build.** `app.config.ts` generates
the build number (`yymmdd##`, used for both `versionCode` and `CFBundleVersion`) and reads the
version from `package.json`, but only when prebuild runs. `ios/` and `android/` are committed,
so `expo run:*`, Gradle and Xcode reuse whatever number the last prebuild wrote, and the stores
reject a reused one. For a second build on the same day, bump `buildToday` in `app.config.ts`
first. Prebuilding iOS runs `pod install`, so do it on a Mac; commit the regenerated folders.

### Make changes

[Routes](https://docs.expo.dev/router/introduction) live in the **app** directory. Those routes' components/hooks/utils/whatever live in the **lib** directory.

After making changes to assets or libraries, you might have to sync some stuff up with

```bash
npx expo prebuild --clean
```

before continuing with the dev commands up above. `ios/` and `android/` are committed, so
commit what prebuild regenerates; never hand-edit them (put native config in `app.config.ts` or
a plugin in `plugins/`).

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
