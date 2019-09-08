import ReactNative from 'react-native'

const {
  DeviceEventEmitter,
  NativeAppEventEmitter,
  Platform,
  NativeModules
} = ReactNative

// noinspection JSUnresolvedVariable
const RNZipArchive = NativeModules.RNZipArchive

export const unzip = (source, target, charset = 'UTF-8') => {
  return RNZipArchive.unzip(source, target, charset)
}

export const unzipWithPassword = (source, target, password) => {
  return RNZipArchive.unzipWithPassword(source, target, password)
}

export const zipWithPassword = (source, target, password, encryptionMethod = '') => {
  // noinspection JSUnresolvedFunction
  return RNZipArchive.zipWithPassword(source, target, password, encryptionMethod)
}

// noinspection JSUnusedGlobalSymbols
export const isPasswordProtected = (source) => {
  // noinspection JSUnresolvedFunction
  return RNZipArchive.isPasswordProtected(source).then(isEncrypted => !!isEncrypted)
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
  const emitter = Platform.OS === 'ios' ? NativeAppEventEmitter : DeviceEventEmitter
  return emitter.addListener('zipArchiveProgressEvent', callback)
}
