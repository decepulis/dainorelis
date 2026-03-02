const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

/**
 * Sets the iOS scheme's LaunchAction buildConfiguration to "Release"
 * so that `npx expo prebuild --clean` preserves this setting.
 */
function withIosReleaseScheme(config) {
  return withDangerousMod(config, [
    'ios',
    (config) => {
      const iosDir = path.join(config.modRequest.projectRoot, 'ios');
      const schemeFiles = globSync('*.xcodeproj/xcshareddata/xcschemes/*.xcscheme', {
        cwd: iosDir,
        absolute: true,
      });

      for (const schemePath of schemeFiles) {
        let contents = fs.readFileSync(schemePath, 'utf8');

        // Change LaunchAction buildConfiguration from "Debug" to "Release"
        contents = contents.replace(
          /(<LaunchAction\s[^>]*?)buildConfiguration\s*=\s*"Debug"/,
          '$1buildConfiguration = "Release"'
        );

        fs.writeFileSync(schemePath, contents, 'utf8');
      }

      return config;
    },
  ]);
}

module.exports = withIosReleaseScheme;
