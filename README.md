# React Native Zip Archive

Zip archive utility for react-native

Note: this project is under development and functionality will improve over time. Currently it provides only the bare minimum of functionality.

## Installation

```bash
npm install react-native-zip-archive --save
```

 Note that does not support Android.

## Getting started - iOS

1. In XCode, in the project navigator right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-zip-archive` and add `RNZipArchive.xcodeproj`
3. Add `libRNZipArchive.a` (from 'Products' under RNZipArchive.xcodeproj) to your project's `Build Phases` ➜ `Link Binary With Libraries` phase
4. Add the `libz` library to your target 
5. Look for Header Search Paths and make sure it contains both `$(SRCROOT)/../react-native/React` and `$(SRCROOT)/../../React` - mark both as recursive
6. Run your project (`Cmd+R`)

## Usage

require it in your file

```js
const ZipArchive = require('react-native').NativeModules.RNZipArchive
```


## API

**unzip(source: string, target: string): Promise**

> unzip from source to target

Example

```js
ZipArchive.unzip(`sourcePath`, `targetPath`)
.then(() => {
  console.log('unzip completed!')
})
catch((error) => {
  console.log(error)
})
```
