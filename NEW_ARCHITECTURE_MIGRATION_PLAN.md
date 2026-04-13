# React Native Zip Archive - New Architecture Migration Plan

## Executive Summary

This document outlines the plan to migrate `react-native-zip-archive` from Legacy Native Modules to **TurboModules** (React Native New Architecture). This is a **breaking change** requiring a major version bump.

**Key Approach**: Use subagents for parallel development with clear dependency chains.

---

## 1. Version Strategy (Semver)

### Current Version
- **v7.1.0** - Legacy Native Module implementation

### New Version
- **v8.0.0** - TurboModule implementation (New Architecture)

### Why Major Version Bump?

| Breaking Change | Impact |
|-----------------|--------|
| Minimum React Native version | From `>=0.60.0` to `>=0.70.0` (or `>=0.76.0`) |
| Architecture requirement | New Architecture (TurboModules) required |
| Native module system | Complete rewrite from Legacy to TurboModules |
| iOS minimum version | Likely increase to iOS 13+ (for New Architecture support) |
| Android minimum SDK | Likely increase to API 23+ (Android 6.0) |

---

## 2. Branch Strategy

### Branch Naming
```
feat/new-architecture     # Main development branch
```

### Branch Workflow

```
master (v8.x development)
  │
  ├─── feat/new-architecture ───┬─── Task 1: TypeScript Spec (coder)
  │                             ├─── Task 2: iOS TurboModule (coder)
  │                             ├─── Task 3: Android TurboModule (coder)
  │                             ├─── Task 4: Playground Project (coder)
  │                             ├─── Task 5: JS API Updates (coder)
  │                             └─── Task 6: README Rewrite (coder)
  │                                          │
  │                                          ▼
  │                                   release/8.0.0
  │                                          │
  │                                          ▼
  │                                        v8.0.0
  │
  └─── playground/*        # Playground updates and improvements
```

### Release Branches
- `release/8.0.0-rc.1` - First release candidate
- `release/8.0.0` - Stable release

### Version Support Policy
- **v8.x only**: No maintenance planned for v7.x
- Users on older React Native versions should remain on v7.x
- Critical security issues in v7.x will be considered on a case-by-case basis

---

## 3. Subagent Task Breakdown

### Task Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MIGRATION WORKFLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

Phase 1: Foundation (Parallel)
┌──────────────────┐     ┌──────────────────┐
│  Task 0: Setup   │────▶│  Task 1: TS Spec │
│  (parent agent)  │     │    (coder)       │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Phase 2: Implementation                             │
│                     (Tasks 2a, 2b, 2c parallel)                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  Task 1: TS Spec │◄──────────────────────────┐
                    │    COMPLETE      │                           │
                    └────────┬─────────┘                           │
                             │                                     │
         ┌───────────────────┼───────────────────┐                 │
         │                   │                   │                 │
         ▼                   ▼                   ▼                 │
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│ Task 2a: iOS    │  │ Task 2b: Android│  │ Task 2c: JS     │     │
│ TurboModule     │  │ TurboModule     │  │ Integration     │     │
│ (coder)         │  │ (coder)         │  │ (coder)         │     │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
         │                    │                    │              │
         └────────────────────┼────────────────────┘              │
                              │                                   │
                              ▼                                   │
                    ┌──────────────────┐                          │
                    │ Task 3: Package  │                          │
                    │ Integration      │                          │
                    │ (parent agent)   │                          │
                    └────────┬─────────┘                          │
                             │                                    │
                             ▼                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Phase 3: Testing & Demo                             │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ Task 3: Package  │◄─────────────────────────────────────┘
                    │ Integration      │
                    │ COMPLETE         │
                    └────────┬─────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
         ▼                                       ▼
┌─────────────────────┐               ┌─────────────────────┐
│ Task 4: Playground  │               │ Task 5: Unit Tests  │
│ App                 │               │ & Integration       │
│ (coder)             │               │ (coder)             │
└────────┬────────────┘               └────────┬────────────┘
         │                                     │
         └───────────────────┬─────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Task 6: README   │
                    │ & Documentation  │
                    │ (coder)          │
                    └────────┬─────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Phase 4: Release                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │ Task 6: Docs     │
                    │ COMPLETE         │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Task 7: RC       │
                    │ Release          │
                    │ (parent agent)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Task 8: Stable   │
                    │ Release          │
                    │ (parent agent)   │
                    └──────────────────┘
```

---

## 4. Detailed Subagent Tasks

### Task 0: Setup (Parent Agent)
**Agent**: Parent (you)
**Estimated Time**: 30 minutes
**Prerequisites**: None

**Actions**:
```bash
# Create feature branch
git checkout -b feat/new-architecture

# Update version in package.json to 8.0.0-rc.1
# Update .npmignore to exclude playground
```

**Outputs**:
- `feat/new-architecture` branch created
- `package.json` version updated to `8.0.0-rc.1`
- `.npmignore` updated with `playground/` (Expo development build - not for npm)

---

### Task 1: TypeScript Specification
**Subagent Type**: `coder`
**Estimated Time**: 2-3 hours
**Prerequisites**: Task 0 complete

**Prompt for Subagent**:
```
Create the TypeScript specification file for react-native-zip-archive TurboModule.

Context:
- This is a zip/unzip library for React Native
- Current API has: zip, zipWithPassword, unzip, unzipWithPassword, 
  unzipAssets, isPasswordProtected, getUncompressedSize, subscribe
- Needs to support event emitting for progress

Create: specs/NativeZipArchive.ts

Requirements:
1. Import TurboModule types from 'react-native'
2. Define Spec interface extending TurboModule
3. Include ALL methods with correct TypeScript types:
   - isPasswordProtected(file: string): Promise<boolean>
   - unzip(from: string, destinationPath: string, charset: string): Promise<string>
   - unzipWithPassword(from: string, destinationPath: string, password: string): Promise<string>
   - zipFolder(from: string, destinationPath: string, compressionLevel: number): Promise<string>
   - zipFiles(from: string[], destinationPath: string, compressionLevel: number): Promise<string>
   - zipFolderWithPassword(from: string, destinationPath: string, password: string, encryptionType: string, compressionLevel: number): Promise<string>
   - zipFilesWithPassword(from: string[], destinationPath: string, password: string, encryptionType: string, compressionLevel: number): Promise<string>
   - getUncompressedSize(path: string, charset: string): Promise<number>
   - unzipAssets(source: string, target: string): Promise<string>
   - addListener(eventName: string): void
   - removeListeners(count: number): void
4. Export using TurboModuleRegistry.getEnforcing<Spec>('RNZipArchive')

Also update package.json to add:
- "codegenConfig" section with name, type, jsSrcsDir, android.javaPackageName
- Update peerDependencies: react-native to >=0.70.0
```

**Outputs**:
- `specs/NativeZipArchive.ts` created
- `package.json` updated with codegenConfig

**Verification**:
```bash
# Verify TypeScript compiles
npx tsc specs/NativeZipArchive.ts --noEmit
```

---

### Task 2a: iOS TurboModule Implementation
**Subagent Type**: `coder`
**Estimated Time**: 6-8 hours
**Prerequisites**: Task 1 complete (spec exists)

**Prompt for Subagent**:
```
Convert the iOS implementation from Legacy Native Module to TurboModule.

Current files to read first:
- ios/RNZipArchive.h
- ios/RNZipArchive.m
- specs/NativeZipArchive.ts (generated spec)

Create/Modify:
1. ios/RNZipArchive.h - Update to import generated spec
2. ios/RNZipArchive.mm - Rename from .m, implement TurboModule protocol

Key changes:
- Remove RCT_EXPORT_MODULE() macro
- Remove RCT_EXPORT_METHOD macros
- Change @interface to implement <NativeZipArchiveSpec>
- Keep RCTEventEmitter functionality for progress events
- Keep SSZipArchive delegate methods
- All method signatures must match generated Spec exactly

The module should:
- Extend NSObject, not RCTEventEmitter directly
- Implement the generated protocol methods
- Still emit progress events via event emitter
- Use the same internal logic for zip/unzip operations

Don't forget to update the podspec if needed for the .mm file.
```

**Outputs**:
- `ios/RNZipArchive.h` updated
- `ios/RNZipArchive.m` renamed to `ios/RNZipArchive.mm`
- `ios/RNZipArchive.mm` implements TurboModule protocol

**Verification**:
- Code compiles in Xcode
- All RCT_EXPORT_METHOD replaced with protocol implementations

---

### Task 2b: Android TurboModule Implementation
**Subagent Type**: `coder`
**Estimated Time**: 6-8 hours
**Prerequisites**: Task 1 complete (spec exists)

**Prompt for Subagent**:
```
Convert the Android implementation from Legacy Native Module to TurboModule.

Current files to read first:
- android/src/main/java/com/rnziparchive/RNZipArchiveModule.java
- android/src/main/java/com/rnziparchive/RNZipArchivePackage.java
- specs/NativeZipArchive.ts (generated spec)

Create/Modify:
1. android/src/main/java/com/rnziparchive/RNZipArchiveModule.java
2. android/src/main/java/com/rnziparchive/RNZipArchivePackage.java

Key changes for RNZipArchiveModule:
- Change extends from ReactContextBaseJavaModule to NativeZipArchiveSpec
- Remove @ReactMethod annotations
- Methods become direct overrides (no annotation needed)
- Constructor stays the same
- All method signatures must match generated Spec exactly

Key changes for RNZipArchivePackage:
- Change implements ReactPackage to extends BaseReactPackage
- Update createNativeModules() to getModule()
- Add ReactModuleInfoProvider with isTurboModule=true

The module should maintain all existing functionality:
- All zip/unzip methods
- Progress event emission
- Password protection
- Asset extraction
```

**Outputs**:
- `RNZipArchiveModule.java` extends NativeZipArchiveSpec
- `RNZipArchivePackage.java` extends BaseReactPackage

**Verification**:
- Gradle builds successfully
- No @ReactMethod annotations remain

---

### Task 2c: JavaScript Integration
**Subagent Type**: `coder`
**Estimated Time**: 2-3 hours
**Prerequisites**: Task 1 complete

**Prompt for Subagent**:
```
Update the JavaScript entry point to support TurboModules while maintaining backward compatibility.

Current file to read:
- index.js

Modify:
- index.js

Requirements:
1. Import TurboModuleRegistry from 'react-native'
2. Try to get module via TurboModuleRegistry.get('RNZipArchive')
3. Fall back to NativeModules.RNZipArchive if not found
4. Throw helpful error if neither works
5. Keep all existing exports the same
6. Keep NativeEventEmitter usage for progress events

Example pattern:
```javascript
const RNZipArchive = TurboModuleRegistry.get('RNZipArchive') || NativeModules.RNZipArchive;
if (!RNZipArchive) {
  throw new Error('react-native-zip-archive: Native module not found...');
}
```

All exports must remain identical:
- zip
- zipWithPassword
- unzip
- unzipWithPassword
- unzipAssets
- isPasswordProtected
- getUncompressedSize
- subscribe
- compression level constants
```

**Outputs**:
- `index.js` updated with TurboModule support

---

### Task 3: Package Integration (Parent Agent)
**Agent**: Parent (you)
**Estimated Time**: 1-2 hours
**Prerequisites**: Tasks 2a, 2b, 2c complete

**Actions**:
1. Review and merge all subagent outputs
2. Run Codegen to generate native interfaces
3. Fix any integration issues
4. Ensure all three platforms (iOS, Android, JS) work together

**Commands**:
```bash
# iOS - Generate Codegen artifacts
cd ios && pod install

# Android - Generate Codegen artifacts
cd android && ./gradlew generateCodegenArtifactsFromSchema

# Verify JS bundle builds
npx metro build index.js --out test.bundle
```

**Outputs**:
- All generated specs in correct locations
- No build errors on iOS or Android
- JS entry point works

---

### Task 4: Playground Project (Expo Development Build)
**Subagent Type**: `coder`
**Estimated Time**: 10-12 hours
**Prerequisites**: Task 3 complete (package works)

**Research Summary - Expo + Native Modules**:

From Expo documentation (docs.expo.dev):

1. **Expo Go CANNOT be used** with custom native modules like react-native-zip-archive
2. **Solution**: Use `expo-dev-client` to create a **Development Build**
3. Development builds include the native code and allow hot reloading

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT BUILD                        │
│  (Custom native app with expo-dev-client +                  │
│   react-native-zip-archive native code bundled)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────┴────┐
                    │  Metro  │
                    │ Bundler │
                    └────┬────┘
                         │
┌────────────────────────┴────────────────────────────────────┐
│  PLAYGROUND SOURCE CODE                                     │
│  - JavaScript/TypeScript                                    │
│  - react-native-zip-archive JS API                          │
│  - Can hot reload                                           │
└─────────────────────────────────────────────────────────────┘
```

**Prompt for Subagent**:
```
Create a complete Expo playground app using expo-dev-client for demonstrating react-native-zip-archive.

IMPORTANT: This is NOT a standard React Native app. It uses Expo with Development Builds.

Create directory structure:
```
playground/
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json              # TypeScript config
├── metro.config.js            # Metro with local module linking
├── README.md                  # Setup instructions
├── eas.json                   # EAS Build configuration
├── app/                       # Expo Router file-based routing
│   ├── _layout.tsx            # Root layout with navigation
│   ├── index.tsx              # Home screen (feature list)
│   ├── zip.tsx                # Zip operations demo
│   ├── unzip.tsx              # Unzip operations demo
│   ├── password.tsx           # Password protection demo
│   ├── progress.tsx           # Progress events demo
│   ├── benchmark.tsx          # Performance benchmarks
│   └── assets.tsx             # Asset extraction demo (Android)
├── components/
│   ├── FilePicker.tsx         # File/directory picker
│   ├── ProgressBar.tsx        # Animated progress bar
│   ├── ResultCard.tsx         # Display operation results
│   └── CodePreview.tsx        # Show source code in UI
├── hooks/
│   ├── useZip.ts              # Zip operation hook
│   ├── useUnzip.ts            # Unzip operation hook
│   └── useProgress.ts         # Progress event hook
├── utils/
│   ├── fileSystem.ts          # File system helpers
│   ├── sampleData.ts          # Sample files for testing
│   └── benchmarks.ts          # Performance test utilities
└── constants.ts               # App constants
```

Requirements:

1. package.json MUST include:
```json
{
  "name": "react-native-zip-archive-playground",
  "main": "expo-router/entry",
  "dependencies": {
    "expo": "~52.0.0",
    "expo-dev-client": "~5.0.0",           // REQUIRED for native modules
    "expo-router": "~4.0.0",
    "expo-file-system": "~18.0.0",
    "expo-document-picker": "~13.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-zip-archive": "file:..",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "~4.12.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "^5.3.0"
  }
}
```

2. app.json configuration:
```json
{
  "expo": {
    "name": "RNZipArchive Playground",
    "slug": "rn-zip-archive-playground",
    "version": "1.0.0",
    "plugins": [
      "expo-router"
    ],
    "ios": {
      "bundleIdentifier": "com.example.rnziparchive.playground"
    },
    "android": {
      "package": "com.example.rnziparchive.playground"
    }
  }
}
```

3. eas.json for development builds:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "development-simulator": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    }
  }
}
```

4. metro.config.js for local module linking:
```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the parent directory for changes
config.watchFolders = [path.resolve(__dirname, '..')];

// Resolve node_modules from both playground and parent
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '..', 'node_modules'),
];

module.exports = config;
```

5. Screens to implement (using Expo Router):
   - app/index.tsx: Feature list with links to all demos
   - app/zip.tsx: Zip folder, zip files array, compression level picker
   - app/unzip.tsx: Unzip with charset selection
   - app/password.tsx: Create encrypted zip, decrypt, check password
   - app/progress.tsx: Real-time progress with animated bar
   - app/benchmark.tsx: Compare compression levels, timing
   - app/assets.tsx: Asset extraction demo (Android only)

6. Each screen must:
   - Use Expo Router navigation
   - Show actual working code examples
   - Display results
   - Handle errors gracefully
   - Include "View Source" section showing the code used

7. File system operations:
   - Use expo-file-system for accessing documents directory
   - Use expo-document-picker for selecting files

8. Hooks:
   - useZip: Handle zip operations with loading states
   - useUnzip: Handle unzip operations
   - useProgress: Subscribe to progress events

IMPORTANT NOTES:
- This app CANNOT run in Expo Go
- Users MUST create a development build first
- The development build includes react-native-zip-archive's native code
- After building, they can develop with hot reload
```

**Development Build Instructions for Users**:

Add to playground/README.md:
```markdown
# React Native Zip Archive Playground

## Prerequisites

This playground uses **Expo Development Builds**, NOT Expo Go.
You must create a development build to use react-native-zip-archive.

## Quick Start

### 1. Install dependencies
```bash
cd playground
npm install
```

### 2. Create a Development Build

Option A: Build on EAS (Recommended for first time)
```bash
# iOS Simulator
npx eas build --platform ios --profile development-simulator

# iOS Device
npx eas build --platform ios --profile development

# Android
npx eas build --platform android --profile development
```

Option B: Build locally
```bash
# iOS
npx expo run:ios

# Android  
npx expo run:android
```

### 3. Install the Development Build

After the build completes:
- iOS Simulator: Drag and drop the .app file
- iOS Device: Install via EAS or Xcode
- Android: Install the APK

### 4. Start Development

```bash
npx expo start --dev-client
```

Scan the QR code or press 'i' for iOS / 'a' for Android.

### 5. Making Changes

When you modify react-native-zip-archive source:
1. The JS changes will hot reload automatically
2. Native code changes require rebuilding the development build

## Troubleshooting

### "Native module not found" error
You are trying to run in Expo Go. Use a development build instead.

### Build fails
Ensure you've installed the parent module first:
```bash
cd .. && npm install
```
```

**Outputs**:
- Complete `playground/` directory with Expo project
- `expo-dev-client` configured
- EAS build configuration
- All 6 screens implemented with Expo Router
- Development build instructions

**Verification**:
```bash
cd playground
npm install
# Build development version
npx expo run:ios  # or npx eas build --platform ios --profile development-simulator
```

**Outputs**:
- Complete `playground/` directory with working app
- All 6 screens implemented
- Navigation working
- Can run on iOS and Android simulators

**Verification**:
```bash
cd playground
npm install
cd ios && pod install && cd ..
npx react-native run-ios  # Should build and show app
```

---

### Task 5: Testing Suite
**Subagent Type**: `coder`
**Estimated Time**: 4-6 hours
**Prerequisites**: Task 3 complete

**Prompt for Subagent**:
```
Create comprehensive tests for the TurboModule implementation.

Create:
1. __tests__/api.test.js - API surface tests
2. __tests__/integration.test.js - Integration tests (if possible)
3. playground/e2e/ - E2E tests using Detox (optional)

Test coverage:
- All exported functions exist
- zip() resolves with correct path
- unzip() resolves with correct path
- zipWithPassword() with AES encryption
- unzipWithPassword() decrypts correctly
- isPasswordProtected() returns boolean
- getUncompressedSize() returns number
- subscribe() emits progress events
- Proper error handling for invalid paths
- Proper error handling for wrong passwords

Use Jest for unit tests. Mock the native module where needed.
```

**Outputs**:
- Test files created
- `npm test` passes

---

### Task 6: Documentation
**Subagent Type**: `coder`
**Estimated Time**: 4-5 hours
**Prerequisites**: Task 4 complete (playground working)

**Prompt for Subagent**:
```
Rewrite all documentation for v8.0.0 release.

Files to create/modify:
1. README.md - Complete rewrite
2. MIGRATION.md - New file
3. CHANGELOG.md - Update for v8.0.0
4. playground/README.md - Playground setup guide

README.md must include:
- New Architecture badge
- What's New in v8.0 section
- Breaking changes warning
- Requirements table (RN >= 0.70)
- Installation with New Architecture setup
- API documentation (keep existing)
- Architecture explanation (TurboModule)
- Compatibility matrix
- Playground reference (Expo Development Build)
- Expo users section ( explaining expo-dev-client requirement)

MIGRATION.md must include:
- Prerequisites check
- Step-by-step migration from v7
- Troubleshooting section
- Rollback instructions

Playground README must include:
- Expo Development Build explanation (NOT Expo Go)
- EAS Build instructions
- Local build instructions
- Feature list
- How to test specific features
- Troubleshooting ("Native module not found" = using Expo Go)
```

**Outputs**:
- `README.md` rewritten
- `MIGRATION.md` created
- `CHANGELOG.md` updated
- `playground/README.md` created

---

### Task 7: RC Release (Parent Agent)
**Agent**: Parent (you)
**Estimated Time**: 1 hour
**Prerequisites**: Tasks 4, 5, 6 complete

**Actions**:
```bash
# Final verification
npm test
npm run lint

# Version bump (already at 8.0.0-rc.1)
# Publish to npm with next tag
npm publish --tag next

# Create GitHub release (draft)
# Create release/8.0.0-rc.1 branch
```

**Outputs**:
- `8.0.0-rc.1` published to npm
- GitHub release drafted
- Release branch created

---

### Task 8: Stable Release (Parent Agent)
**Agent**: Parent (you)
**Estimated Time**: 1 hour
**Prerequisites**: Task 7 complete, 2-4 weeks feedback period

**Actions**:
```bash
# Bump version to 8.0.0
npm version 8.0.0

# Publish stable
npm publish

# Merge feat/new-architecture to master
# Tag release
# Close milestone
```

**Outputs**:
- `8.0.0` stable published
- GitHub release published
- Master branch updated

---

## 5. Subagent Execution Order

### Phase 1: Foundation (Week 1)
```
Parent: Task 0 (Setup)
    │
    └──▶ Subagent: Task 1 (TS Spec) ──┐
                                      │
                                      ▼
                              [Wait for completion]
```

### Phase 2: Implementation (Week 1-2)
```
                    ┌───────────────────────┐
                    │ Task 1: TS Spec       │
                    │ COMPLETE              │
                    └───────────┬───────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
   ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
   │ Subagent:    │      │ Subagent:    │      │ Subagent:    │
   │ Task 2a: iOS │      │ Task 2b:     │      │ Task 2c: JS  │
   │ TurboModule  │      │ Android      │      │ Integration  │
   └──────────────┘      │ TurboModule  │      └──────────────┘
                         └──────────────┘
                                │
         ┌──────────────────────┴──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
   [iOS Complete]         [Android Complete]      [JS Complete]
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
                         Parent: Task 3
                         (Integration)
```

### Phase 3: Testing & Demo (Week 3)
```
                    ┌───────────────────┐
                    │ Task 3: Package   │
                    │ Integration       │
                    │ COMPLETE          │
                    └─────────┬─────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
   ┌──────────────┐                        ┌──────────────┐
   │ Subagent:    │                        │ Subagent:    │
   │ Task 4:      │                        │ Task 5:      │
   │ Playground   │                        │ Tests        │
   └──────────────┘                        └──────────────┘
         │                                         │
         └────────────────────┬────────────────────┘
                              │
                              ▼
                       Subagent: Task 6
                       (Documentation)
```

### Phase 4: Release (Week 4+)
```
                    ┌───────────────────┐
                    │ Task 6: Docs      │
                    │ COMPLETE          │
                    └─────────┬─────────┘
                              │
                              ▼
                       Parent: Task 7
                       (RC Release)
                              │
                              ▼
                       [Wait 2-4 weeks]
                              │
                              ▼
                       Parent: Task 8
                       (Stable Release)
```

---

## 6. Rollback Strategy

If a subagent task fails or needs rework:

1. **Parent agent reviews output** before accepting
2. **Failed task**: Re-delegate with clearer instructions
3. **Integration issues**: Parent fixes or delegates specific fixes
4. **Git commits**: Each subagent task should be a separate commit for easy reversion

---

## 7. Communication Between Subagents

Subagents don't communicate directly. Parent agent:
1. Provides all necessary context in initial prompt
2. Collects outputs
3. Verifies completeness
4. Passes relevant info to next subagent

**Information to pass between tasks**:
- Task 1 → Task 2a/2b: Spec file location and contents
- Task 2a/2b/2c → Task 3: All modified files
- Task 3 → Task 4: Confirmed working package
- Task 4 → Task 6: Playground features list

---

## 8. Quality Checklist for Each Task

### Task 1 (TS Spec)
- [ ] All methods typed correctly
- [ ] Package.json has codegenConfig
- [ ] TypeScript compiles

### Task 2a/2b (Native Modules)
- [ ] No Legacy Native Module APIs remaining
- [ ] Implements generated Spec
- [ ] All original functionality preserved
- [ ] Builds without errors

### Task 2c (JS)
- [ ] TurboModuleRegistry fallback works
- [ ] All exports unchanged
- [ ] Event emitter still works

### Task 4 (Playground)
- [ ] App boots on both platforms
- [ ] All 6 screens accessible
- [ ] Each feature demo works end-to-end
- [ ] Code examples shown in UI

### Task 6 (Docs)
- [ ] Breaking changes clearly stated
- [ ] Migration steps are clear
- [ ] Playground referenced
- [ ] All links work

---

## 9. Updated Timeline

| Phase | Tasks | Duration | Parallel? |
|-------|-------|----------|-----------|
| 1 | 0, 1 | 1 day | No |
| 2 | 2a, 2b, 2c | 3-4 days | **Yes** |
| 3 | 3 | 1 day | No |
| 4 | 4, 5 | 2-3 days | **Yes** |
| 5 | 6 | 1-2 days | No |
| 6 | 7 | 1 day | No |
| 7 | 8 | 1 day | No (wait 2-4 weeks) |
| **Total** | | **~10-13 days active** | |

---

*This plan enables parallel development with clear handoffs and quality gates.*
