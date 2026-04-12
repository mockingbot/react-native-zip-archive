# React Native Zip Archive [![npm](https://img.shields.io/npm/v/react-native-zip-archive.svg)](https://www.npmjs.com/package/react-native-zip-archive)

Zip archive utility for react-native

## Attention

In order to comply with the new privacy policy of the App Store on iOS, you need to upgrade react-native-zip-archive to version 7.0.0, which requires the deployment target to be iOS 15.5 or later.

## For Expo Users

The only way to make this work with Expo is to create a [dev build](https://docs.expo.dev/workflow/overview/#development-builds), the expo go is not supported.

## Compatibility

| react-native version | react-native-zip-archive version |
| --- | --- |
| ^0.60 | ^5.0.0 |
| ^0.58 | ^4.0.0 |
| <0.58 | ^3.0.0 |


## Installation

```bash
npm install react-native-zip-archive --save
```


## Linking

For iOS, run the command below in your app's root folder once the package has been installed

````bash
cd ./ios && pod install
````

For Android, it's ready to go.


## Usage

import it into your code

```js
import { 
  zip, 
  zipWithPassword,
  unzip, 
  unzipWithPassword,
  unzipAssets, 
  subscribe,
  isPasswordProtected,
  getUncompressedSize,
  DEFAULT_COMPRESSION,
  NO_COMPRESSION,
  BEST_SPEED,
  BEST_COMPRESSION
} from 'react-native-zip-archive'
```

you may also want to use something like [react-native-fs](https://github.com/johanneslumpe/react-native-fs) to access the file system (check its repo for more information)

```js
import { MainBundlePath, DocumentDirectoryPath } from 'react-native-fs'
```


## Platform Support Matrix

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| **zip** (folder) | ✅ | ✅ | Full support |
| **zip** (files array) | ✅ | ✅ | Compression level ignored on iOS |
| **zipWithPassword** (folder) | ✅ | ✅ | AES encryption supported on both |
| **zipWithPassword** (files array) | ⚠️ | ✅ | iOS: AES not supported, only standard encryption |
| **unzip** | ✅ | ✅ | Charset param ignored on iOS |
| **unzipWithPassword** | ✅ | ✅ | Full support |
| **unzipAssets** | ❌ | ✅ | Android only |
| **isPasswordProtected** | ✅ | ✅ | Full support |
| **getUncompressedSize** | ✅ | ✅ | Charset param ignored on iOS |
| **Progress Events** | ✅ | ✅ | File path empty on iOS for zip operations |

### Feature Details

#### Compression Levels
- **Android**: Full support for levels 0-9 on all zip operations
- **iOS**: Only supported for folder operations; ignored for file arrays

#### Encryption
- **Android**: AES-128, AES-256, and Standard ZIP encryption for all operations
- **iOS**: 
  - Folder operations: AES and Standard encryption supported
  - File array operations: Only Standard encryption (AES not supported)
  - Note: Both AES-128 and AES-256 use AES-256 on iOS

#### Charset Support
- **Android**: Full support (Android N+), defaults to UTF-8
- **iOS**: Parameter accepted but ignored; always uses UTF-8

#### unzipAssets
- **Android**: Supports both `assets/` folder and `content://` URIs
- **iOS**: Not supported

---

## API

**`zip(source: string | string[], target: string, compressionLevel?: number): Promise<string>`**

> zip source to target

***NOTE: the string version of source is for folder, the string[] version is for file, so if you want to zip a single file, use zip([file]) instead of zip(file)***

***NOTE: customizing the compression level is not supported on iOS with a files source and will be ignored, use a directory source instead.***

**Compression Level Constants:**
- `DEFAULT_COMPRESSION` (-1) - Default compression (same as level 5)
- `NO_COMPRESSION` (0) - Store without compression
- `BEST_SPEED` (1) - Fastest compression (least compressed)
- `BEST_COMPRESSION` (9) - Best compression (slowest)

Example

```js
const targetPath = `${DocumentDirectoryPath}/myFile.zip`
const sourcePath = DocumentDirectoryPath

zip(sourcePath, targetPath)
.then((path) => {
  console.log(`zip completed at ${path}`)
})
.catch((error) => {
  console.error(error)
})
```

**`zipWithPassword(source: string | string[], target: string, password: string, encryptionType?: string, compressionLevel?: number): Promise<string>`**

> zip source to target with password protection

***NOTE: the string version of source is for folder, the string[] version is for file, so if you want to zip a single file, use zip([file]) instead of zip(file)***

**Encryption Types:**
- `'STANDARD'` - Standard ZIP encryption (legacy, widely compatible)
- `'AES-128'` - AES 128-bit encryption
- `'AES-256'` - AES 256-bit encryption

**Platform-specific encryption notes:**
- **iOS**: Both AES-128 and AES-256 use AES-256 internally
- **iOS with files array**: AES encryption is NOT supported; only STANDARD encryption works
- **Android**: All encryption types fully supported for both folders and files

***NOTE: customizing the compression level is not supported on iOS with a files source and will be ignored, use a directory source instead.***

Example

```js
const targetPath = `${DocumentDirectoryPath}/myFile.zip`
const sourcePath = DocumentDirectoryPath
const password = 'password'
const encryptionType = 'STANDARD'; //possible values: AES-256, AES-128, STANDARD. default is STANDARD

zipWithPassword(sourcePath, targetPath, password, encryptionType)
.then((path) => {
  console.log(`zip completed at ${path}`)
})
.catch((error) => {
  console.error(error)
})
```

**`unzip(source: string, target: string, charset?: string): Promise<string>`**

> unzip from source to target

***NOTE: The charset parameter is only supported on Android. On iOS, it is accepted but ignored; UTF-8 is always used.***

Example

```js
const sourcePath = `${DocumentDirectoryPath}/myFile.zip`
const targetPath = DocumentDirectoryPath
const charset = 'UTF-8'
// charset possible values: UTF-8, GBK, US-ASCII and so on. If none was passed, default value is UTF-8
// Note: charset is only effective on Android

unzip(sourcePath, targetPath, charset)
.then((path) => {
  console.log(`unzip completed at ${path}`)
})
.catch((error) => {
  console.error(error)
})
```

**`unzipWithPassword(source: string, target: string, password: string): Promise<string>`**

> unzip from source to target

Example

```js
const sourcePath = `${DocumentDirectoryPath}/myFile.zip`
const targetPath = DocumentDirectoryPath
const password = 'password'

unzipWithPassword(sourcePath, targetPath, password)
.then((path) => {
  console.log(`unzip completed at ${path}`)
})
.catch((error) => {
  console.error(error)
})
```

**`unzipAssets(assetPath: string, target: string): Promise<string>`**

> unzip file from Android `assets` folder to target path

***Note: Android only.***

`assetPath` is the relative path to the file inside the pre-bundled assets folder, e.g. `folder/myFile.zip`. ***Do not pass an absolute directory.***

```js
const assetPath = './myFile.zip'
const targetPath = DocumentDirectoryPath

unzipAssets(assetPath, targetPath)
.then((path) => {
  console.log(`unzip completed at ${path}`)
})
.catch((error) => {
  console.error(error)
})
```

**`getUncompressedSize(source: string, charset?: string): Promise<number>`**

> Returns the total uncompressed size of all files in the zip archive (in bytes).

***Note: On iOS, the charset parameter is accepted but ignored.***

Example

```js
const sourcePath = `${DocumentDirectoryPath}/myFile.zip`

getUncompressedSize(sourcePath)
.then((size) => {
  console.log(`Uncompressed size: ${size} bytes`)
})
.catch((error) => {
  console.error(error)
})
```

**`subscribe(callback: ({ progress: number, filePath: string }) => void): EmitterSubscription`**

> Subscribe to the progress callbacks. Useful for displaying a progress bar on your UI during the process.

Your callback will be passed an object with the following fields:

- `progress` (number)  a value from 0 to 1 representing the progress of the unzip method. 1 is completed.
- `filePath` (string)  the zip file path of zipped or unzipped file.


***Note: Remember to check the filename while processing progress, to be sure that the unzipped or zipped file is the right one, because the event is global.***

***Note: Remember to unsubscribe! Run .remove() on the object returned by this method.***

```js
componentDidMount() {
  this.zipProgress = subscribe(({ progress, filePath }) => {
    // the filePath is always empty on iOS for zipping.
    console.log(`progress: ${progress}\nprocessed at: ${filePath}`)
  })
}

componentWillUnmount() {
  // Important: Unsubscribe from the progress events
  this.zipProgress.remove()
}
```

## Example App
You can use this repo, https://github.com/plrthink/RNZATestApp, for testing and contribution. For more information please refer to its README.


## Related Projects

- [ZipArchive](https://github.com/ZipArchive/ZipArchive)
- [zip4j](https://github.com/srikanth-lingala/zip4j)

---

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/plrthink)
