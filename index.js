'use strict'

var RNZipArchive = require('NativeModules').RNZipArchive
var Promise = require('bluebird')

var _unzip = Promise.promisify(RNZipArchive.unzip)

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
