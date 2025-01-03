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
