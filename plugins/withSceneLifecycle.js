const { withAppDelegate } = require('expo/config-plugins');

// iOS 27 requires the UIScene life cycle. Expo's `EXExpoAppSceneDelegate` (set in app.json
// `ios.infoPlist`) creates the window and starts React Native, so the app delegate must only
// create the factory and expose it via `ExpoReactNativeFactoryProvider`.
module.exports = (config) =>
  withAppDelegate(config, (config) => {
    config.modResults.contents = config.modResults.contents
      .replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {')
      .replace(/\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow[\s\S]*?#endif\n/, '\n');
    return config;
  });
