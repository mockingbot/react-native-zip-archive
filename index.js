import ReactNative from 'react-native'

const {
  DeviceEventEmitter,
  NativeAppEventEmitter,
  Platform,
  NativeModules
} = ReactNative

const RNZipArchive = NativeModules.RNZipArchive

export const unzip = (source, target) => {
  return RNZipArchive.unzip(source, target)
}

export const unzipWithPassword = (source, target, password) => {
  return RNZipArchive.unzip(source, target, password)
}

export const isPasswordProtected = (source) => {
  return RNZipArchive.isPasswordProtected(source)
}

export const zip = (source, target) => {
  return RNZipArchive.zip(source, target)
}

export const unzipAssets = (source, target) => {
  if (!RNZipArchive.unzipAssets) {
    throw new Error('unzipAssets not supported on this platform')
  }

  return RNZipArchive.unzipAssets(source, target)
}

export const subscribe = callback => {
  const emitter =
    Platform.OS === 'ios' ? NativeAppEventEmitter : DeviceEventEmitter
  return emitter.addListener('zipArchiveProgressEvent', callback)
}
