const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// react-native-gifted-charts imports react-native-linear-gradient internally.
// In Expo managed workflow, alias it to expo-linear-gradient.
config.resolver.extraNodeModules = {
  'react-native-linear-gradient': require.resolve('expo-linear-gradient'),
};

module.exports = withNativeWind(config, { input: './global.css' });
