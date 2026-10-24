const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Adds release signing config to android/app/build.gradle so that
 * `npx expo prebuild --clean` preserves the release keystore configuration.
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    if (buildGradle.includes('signingConfigs.release')) {
      return config;
    }

    // Insert release signing config after the debug block
    const releaseSigningConfig = [
      '        release {',
      "            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {",
      '                storeFile file(MYAPP_UPLOAD_STORE_FILE)',
      '                storePassword MYAPP_UPLOAD_STORE_PASSWORD',
      '                keyAlias MYAPP_UPLOAD_KEY_ALIAS',
      '                keyPassword MYAPP_UPLOAD_KEY_PASSWORD',
      '            }',
      '        }',
    ].join('\n');

    buildGradle = buildGradle.replace(
      /(signingConfigs\s*\{[^}]*debug\s*\{[^}]*\})\s*(\})/s,
      `$1\n${releaseSigningConfig}\n    $2`
    );

    // Change release buildType to use signingConfigs.release instead of debug
    buildGradle = buildGradle.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      '$1signingConfig signingConfigs.release'
    );

    config.modResults.contents = buildGradle;
    return config;
  });
}

module.exports = withAndroidReleaseSigning;
