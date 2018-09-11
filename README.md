# React Native Zip Archive [![npm](https://img.shields.io/npm/dm/react-native-zip-archive.svg)](https://www.npmjs.com/package/react-native-zip-archive) [![npm](https://img.shields.io/npm/v/react-native-zip-archive.svg)](https://www.npmjs.com/package/react-native-zip-archive)

Zip archive utility for react-native

## Installation

```bash
npm install react-native-zip-archive --save
```

## Linking

### Automatically (Recommend)

````bash
react-native link react-native-zip-archive
````

### Manually

#### iOS

refer to the [official guide](https://facebook.github.io/react-native/docs/linking-libraries-ios.html)

#### Android

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

* For react-native blew 0.19.0
  - Edit your `MainActivity.java` (deep in `android/app/src/main/java/...`) to look like this (note **two** places to edit):

  ```diff
  + import import com.rnziparchive.RNZipArchivePackage;

  ....

    @Override
    protected void onCreate(Bundle savedInstanceState) {
      super.onCreate(savedInstanceState);
      mReactRootView = new ReactRootView(this);

      mReactInstanceManager = ReactInstanceManager.builder()
        .setApplication(getApplication())
        .setBundleAssetName("index.android.bundle")
        .setJSMainModuleName("index.android")
        .addPackage(new MainReactPackage())
  +     .addPackage(new RNZipArchivePackage())
        .setUseDeveloperSupport(BuildConfig.DEBUG)
        .setInitialLifecycleState(LifecycleState.RESUMED)
        .build();

      mReactRootView.startReactApplication(mReactInstanceManager, "ExampleRN", null);

      setContentView(mReactRootView);
    }
  ```

* react-native 0.19.0 and higher

  - Edit your `MainActivity.java` (deep in `android/app/src/main/java/...`) to look like this (note **two** places to edit):

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

* For react-native 0.29.0 and higher ( in MainApplication.java )

  - Edit your `MainApplication.java` (deep in `android/app/src/main/java/...`) to look like this (note **three** places to edit):

  ```diff
  + import com.rnziparchive.RNZipArchivePackage;

  public class MainApplication extends Application implements ReactApplication {
    ...
      @Override
      protected List<ReactPackage> getPackages() {
        return Arrays.<ReactPackage>asList(
  -       new MainReactPackage()
  +       new MainReactPackage(),
  +       new RNZipArchivePackage()
        );
      }
  ```

## Usage

import it into your code

```js
import { zip, unzip, unzipAssets, subscribe } from 'react-native-zip-archive'
```

you may also want to use something like [react-native-fs](https://github.com/johanneslumpe/react-native-fs) to access the file system (check its repo for more information)

```js
import { MainBundlePath, DocumentDirectoryPath } from 'react-native-fs'
```

## API

**zip(source: string, target: string): Promise**

> zip source to target

Example

```js
const targetPath = `${DocumentDirectoryPath}/myFile.zip`
const sourcePath = DocumentDirectoryPath

zip(sourcePath, targetPath)
.then((path) => {
  console.log(`zip completed at ${path}`)
})
.catch((error) => {
  console.log(error)
})
```

**unzip(source: string, target: string): Promise**

> unzip from source to target

Example

```js
const sourcePath = `${DocumentDirectoryPath}/myFile.zip`
const targetPath = DocumentDirectoryPath

unzip(sourcePath, targetPath)
.then((path) => {
  console.log(`unzip completed at ${path}`)
})
.catch((error) => {
  console.log(error)
})
```

**unzipAssets(assetPath: string, target: string): Promise**

> unzip file from Android `assets` folder to target path

*Note: Android only.*

`assetPath` is the relative path to the file inside the pre-bundled assets folder, e.g. `folder/myFile.zip`. ***Do not pass an absolute directory.***

```js
const assetPath = `${DocumentDirectoryPath}/myFile.zip`
const targetPath = DocumentDirectoryPath

unzipAssets(assetPath, targetPath)
.then(() => {
  console.log('unzip completed!')
})
.catch((error) => {
  console.log(error)
})
```

**subscribe(callback: ({ progress: number, filePath: string })): EmitterSubscription**

> Subscribe to the progress callbacks. Useful for displaying a progress bar on your UI during the process.

Your callback will be passed an object with the following fields:

- `progress` (number)  a value from 0 to 1 representing the progress of the unzip method. 1 is completed.
- `filePath` (string)  the zip file path of zipped or unzipped file.


*Note: Remember to check the filename while processing progress, to be sure that the unzipped or zipped file is the right one, because the event is global.*

*Note: Remember to unsubscribe! Run .remove() on the object returned by this method.*

```js
componentDidMount() {
  this.zipProgress = subscribe(({ progress, filePath }) => {
    this.setState({ zipProgress: progress })
  })
}

componentWillUnmount() {
  // Important: Unsubscribe from the progress events
  this.zipProgress.remove()
}
```

## Related Projects

- [ZipArchive](https://github.com/ZipArchive/ZipArchive)
