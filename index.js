import ReactNative from 'react-native'

const {
  DeviceEventEmitter,
  NativeAppEventEmitter,
  Platform,
  NativeModules
} = ReactNative

const RNZipArchive = NativeModules.RNZipArchive

const ZipArchive = {
  unzip (source, target) {
    return RNZipArchive.unzip(source, target)
  },
  zip (source, target) {
    return RNZipArchive.zip(source, target)
  },
  unzipAssets (source, target) {
    if (!RNZipArchive.unzipAssets) {
      throw new Error('unzipAssets not supported on this platform')
    }

    return RNZipArchive.unzipAssets(source, target)
  },
  subscribe (callback) {
    var emitter = Platform.OS === 'ios' ? NativeAppEventEmitter : DeviceEventEmitter
    return emitter.addListener('zipArchiveProgressEvent', callback)
  }
}

export default ZipArchive
