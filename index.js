'use strict'

var RNZipArchive = require('react-native').NativeModules.RNZipArchive
var promisify = require("es6-promisify")

var _unzip = promisify(RNZipArchive.unzip)

var _error = (err) => {
  throw error
}

var ZipArchive = {
  unzip(source, target) {
    return _unzip(source, target)
      .catch(_error)
  }
}

module.exports = ZipArchive