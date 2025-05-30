# Dainorėlis

This is an [Expo](https://expo.dev) project. As best as I understand it, Expo is a framework to make everything about developing with [React Native](https://reactnative.dev/) easier. This project was created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

### Install dependencies

```bash
npm install
```

### Start the app

```bash
npm run dev:web
npm run dev:ios
npm run dev:android
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

### Release

If you _do_ want to deal with TestFlight or Google Play Console to test a production build on your device (or other peoples' devices)... or if you're just ready to release a new version of the app, check this out:

- [Create a production build locally](https://docs.expo.dev/guides/local-app-production/)

  > You may have to make `SENTRY_AUTH_TOKEN` available in your environment.

### Make changes

[Routes](https://docs.expo.dev/router/introduction) live in the **app** directory. Those routes' components/hooks/utils/whatever live in the **lib** directory.

After making changes to assets or libraries, you might have to sync some stuff up with

```bash
npx expo prebuild --clean
```

before continuing with the dev commands up above

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
