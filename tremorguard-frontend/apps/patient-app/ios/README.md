# iOS 原生项目目录

此目录为 React Native iOS 原生项目占位目录。

## 初始化
```bash
cd apps/patient-app
npx react-native init TremorGuard --template react-native-template-typescript
```

或使用 expo：
```bash
npx create-expo-app . --template blank-typescript
```

## 注意事项
- 需配置 react-native-ble-plx 原生依赖
- 需配置 expo-sqlite 原生依赖
- Info.plist 需添加蓝牙权限描述
