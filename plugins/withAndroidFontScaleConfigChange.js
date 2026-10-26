const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

/**
 * Lets MainActivity handle a font scale change itself instead of being recreated. React Native picks the new
 * scale up without a restart, while a recreated activity briefly mounts a second React root (React Navigation
 * then warns that linking is configured in multiple places) and drops the screen's state.
 */
function withAndroidFontScaleConfigChange(config) {
  return withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    const changes = (activity.$['android:configChanges'] ?? '').split('|').filter(Boolean);
    if (!changes.includes('fontScale')) changes.push('fontScale');
    activity.$['android:configChanges'] = changes.join('|');
    return config;
  });
}

module.exports = withAndroidFontScaleConfigChange;
