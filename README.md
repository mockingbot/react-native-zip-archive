# React Native Zip Archive

Zip archive utility for react-native

Note: this project is under development and functionality will improve over time. Currently it provides only the bare minimum of functionality.

## Installation

```bash
npm install react-native-zip-archive --save
```

## Getting started - iOS

1. In XCode, in the project navigator right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-zip-archive` and add `RNZipArchive.xcodeproj`
3. Add `libRNZipArchive.a` (from 'Products' under RNZipArchive.xcodeproj) to your project's `Build Phases` ➜ `Link Binary With Libraries` phase
4. Add the `libz` library to your target
5. Look for Header Search Paths and make sure it contains both `$(SRCROOT)/../react-native/React` and `$(SRCROOT)/../../React` - mark both as recursive
6. Run your project (`Cmd+R`)

## Getting started - Android

* Edit `android/settings.gradle` to look like this (without the +):

  ```diff
  rootProject.name = 'MyApp'

  include ':app'

  + include ':react-native-zip-archive'
  + project(':react-native-zip-archive').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-zip-archive/android')
  ```

* Edit `android/app/build.gradle` (note: **app** folder) to look like this:

  ```diff
  apply plugin: 'com.android.application'

  android {
    ...
  }

  dependencies {
    compile fileTree(dir: 'libs', include: ['*.jar'])
    compile 'com.android.support:appcompat-v7:23.0.0'
    compile 'com.facebook.react:react-native:0.16.+'
  + compile project(':react-native-zip-archive')
  }
  ```

* Edit your `MainActivity.java` (deep in `android/app/src/main/java/...`) to look like this (note **two** places to edit):

  ```diff
  package com.myapp;

  + import com.rnziparchive.RNZipArchivePackage;

  ....

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
  +     new RNZipArchivePackage()
      );
    }

  }
  ```

## Usage

require it in your file

```js
const ZipArchive = require('react-native-zip-archive')
```

you may also want to use something like [react-native-fs](https://github.com/johanneslumpe/react-native-fs) to access the file system (check its repo for more information)

```js
const RNFS = require('react-native-fs')
```

## API

**unzip(source: string, target: string): Promise**

> unzip from source to target

Example

```js
let sourcePath = 'path_to_your_zip_file'
let targetPath = RNFS.DocumentDirectoryPath

ZipArchive.unzip(sourcePath, targetPath)
.then(() => {
  console.log('unzip completed!')
})
.catch((error) => {
  console.log(error)
})
```
