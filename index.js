'use strict'

var RNZipArchive = require('NativeModules').RNZipArchive

var ZipArchive = {
  unzip(source, target) {
    RNZipArchive.unzip(source, target)
  }
}

module.exports = ZipArchive
