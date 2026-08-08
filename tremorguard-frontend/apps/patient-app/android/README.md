# Android 原生项目目录

此目录为 React Native Android 原生项目占位目录。

## 初始化
```bash
cd apps/patient-app
npx react-native init TremorGuard --template react-native-template-typescript
```

## 注意事项
- 需配置 react-native-ble-plx 原生依赖
- 需配置 expo-sqlite 原生依赖
- AndroidManifest.xml 需添加蓝牙和位置权限
- 最低 SDK 版本: API 21 (Android 5.0)
- 目标 SDK 版本: API 33 (Android 13)
