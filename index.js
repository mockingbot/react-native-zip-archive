'use strict'

var React = require('react-native')
var { DeviceEventEmitter, NativeAppEventEmitter, Platform } = React

var RNZipArchive = React.NativeModules.RNZipArchive
var promisify = require("es6-promisify")

var _unzip = promisify(RNZipArchive.unzip)
var _unzipAssets = RNZipArchive.unzipAssets ? promisify(RNZipArchive.unzipAssets) : undefined

var _error = (err) => {
  throw err
}

var ZipArchive = {
  unzip(source, target) {
    return _unzip(source, target)
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
      const emitter = Platform.OS == 'ios' ? NativeAppEventEmitter : DeviceEventEmitter;
      return emitter.addListener("zipArchiveProgressEvent", callback);
  }
}

module.exports = ZipArchive
