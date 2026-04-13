# React Native Zip Archive Playground

⚠️ **This playground requires an Expo Development Build.** It does NOT work in Expo Go.

## Quick Start

### 1. Install dependencies
```bash
cd playground
npm install
```

### 2. Create a Development Build

**Option A: EAS Build (Cloud)**
```bash
# iOS Simulator
npx eas build --platform ios --profile development-simulator

# iOS Device
npx eas build --platform ios --profile development

# Android
npx eas build --platform android --profile development
```

**Option B: Local Build**
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### 3. Start Developing

After installing the development build:
```bash
npx expo start --dev-client
```

### Why Development Build?

react-native-zip-archive contains native code (iOS/Android zip libraries). Expo Go does not include this native code, so it cannot run this library. Development builds include the native code and allow hot reloading just like Expo Go.

## Troubleshooting

### "Native module not found"
You are running in Expo Go. Use a development build instead.

### Build errors
Ensure the parent library is installed first:
```bash
cd .. && npm install
```
