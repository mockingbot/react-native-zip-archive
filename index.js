'use strict'

var React = require('react-native')
var { DeviceEventEmitter, NativeAppEventEmitter, Platform } = React

var RNZipArchive = React.NativeModules.RNZipArchive

var _unzip = RNZipArchive.unzip
var _zip = RNZipArchive.zip
var _unzipAssets = RNZipArchive.unzipAssets ? RNZipArchive.unzipAssets : undefined

var _error = (err) => {
  throw err
}

var ZipArchive = {
  unzip(source, target) {
    return _unzip(source, target)
      .catch(_error)
  },
  zip(source, target) {
    return _zip(source, target)
      .catch(_error)
  },
  unzipAssets(source, target) {
    if (!_unzipAssets) {
      throw new Error("unzipAssets not supported on this platform");
    }

    return _unzipAssets(source, target)
      .catch(_error)
  },
  subscribe(callback) {
    var emitter = Platform.OS == 'ios' ? NativeAppEventEmitter : DeviceEventEmitter;
    return emitter.addListener("zipArchiveProgressEvent", callback);
  }
}

module.exports = ZipArchive
