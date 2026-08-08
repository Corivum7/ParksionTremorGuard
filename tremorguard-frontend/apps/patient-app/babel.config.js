module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: {
          '@tremorguard/shared-types': '../../packages/shared-types/src',
          '@tremorguard/utils': '../../packages/utils/src',
          '@tremorguard/ble-service': '../../packages/ble-service/src',
          '@tremorguard/local-db': '../../packages/local-db/src',
          '@tremorguard/sync-engine': '../../packages/sync-engine/src',
        },
      },
    ],
  ],
};
