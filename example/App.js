import React, { Component } from 'react'
import {
  StyleSheet,
  WebView,
  Platform
} from 'react-native'

import { readdir, copyFileAssets, MainBundlePath, DocumentDirectoryPath } from 'react-native-fs'
import { unzip, subscribe } from 'react-native-zip-archive'

export default class App extends Component {
  constructor () {
    super()
    this.state = {
      uri: 'https://github.com/plrthink/react-native-zip-archive'
    }
  }

  componentWillMount () {
    this.zipProgress = subscribe((progress, filePath) => {
      console.log(progress, filePath)
    })
  }

  componentDidMount () {
    let sourcePath
    const targetPath = DocumentDirectoryPath

    if (Platform.OS === 'android') {
      // since I can't simply get absolute path of files in assets folder,
      // I am copying the file from assets folder to document folder as a workaround.
      sourcePath = `${DocumentDirectoryPath}/static.zip`

      copyFileAssets('static.zip', sourcePath)
        .then(() => {
          return readdir(DocumentDirectoryPath)
        })
        .then((result) => {
          return unzip(sourcePath, DocumentDirectoryPath)
        })
        .then((path) => {
          console.log(`unzip file to ${path}`)
          this.setState({
            uri: `file://${path}/static/index.html`
          })
        })
        .catch((error) => {
          console.log(error)
        })
    } else {
      sourcePath = `${MainBundlePath}/static.zip`

      unzip(sourcePath, targetPath)
        .then((path) => {
          console.log(`unzip file to ${path}`)
          this.setState({
            uri: `${path}/static/index.html`
          })
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }

  componentWillUnmount () {
    this.zipProgress.remove()
  }

  render () {
    const { uri } = this.state

    console.log(uri)

    return (
      <WebView
        source={{uri: uri}}
        style={styles.webView}
        startInLoadingState={true}
        scalesPageToFit={true}
      />
    )
  }
}

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    marginTop: 20
  }
})
