import React, { Component } from 'react'
import {
  StyleSheet, View,
  Alert, WebView, Platform
} from 'react-native'
import {
  ANIMATIONS_SLIDE,
  CustomTabs
} from 'react-native-custom-tabs'
import AwesomeButtonRick from 'react-native-really-awesome-button/src/themes/rick'
import { DocumentPicker } from 'react-native-document-picker'
import { copyFile, DocumentDirectoryPath } from 'react-native-fs'
import { subscribe, unzipWithPassword, isPasswordProtected } from 'react-native-zip-archive'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fileDetails: {}, // no browsed file yet
      uri: '' // the extracted file will be used as a uri
    }
  }

  /**
   * Dropbox to download a sample password protected html file
   */
  openLink () {
    let url = 'https://app.box.com/s/2szqk4fzsq7brrbcnuk6z2tdl6jq2rts'
    CustomTabs.openURL(url, {
      toolbarColor: '#607D8B',
      enableUrlBarHiding: true,
      showPageTitle: true,
      enableDefaultShare: true,
      animations: ANIMATIONS_SLIDE
    })
  }

  /**
   * Used to pick the downloaded file
   */
  browseFiles () {
    DocumentPicker.show({
      filetype: [(Platform.OS === 'android') ? "*/*" : "public.data"]
    }, (err, response) => {
      var fileDetails = {
        uri: response.uri,
        name: response.fileName,
        size: response.fileSize,
        type: response.type
      }
      this.setState({
        ...this.state,
        fileDetails: fileDetails
      })
    })
  }

  componentDidMount () {
    this.unzipProgress = subscribe(({ progress, filePath }) => {
      console.log('---- Progress update ----')
      console.log(filePath + ': ' + progress)
      console.log('-------------------------')
    })
  }

  componentWillUnmount () {
    this.unzipProgress.remove()
  }

  extractFile () {
    var fileDetails = this.state.fileDetails
    if (Object.keys(fileDetails).length === 0) {
      Alert.alert('No file selected!')
      return
    }

    // password for the dropbox sample zip file
    var password = 'helloworld'

    var filename = fileDetails.name
    var filePath = DocumentDirectoryPath + '/' + filename
    var unzipPath = DocumentDirectoryPath
    copyFile(fileDetails.uri, filePath).catch((err) => {
      console.log(err)
      return Promise.resolve()
    }).then(() => {
      return isPasswordProtected(filePath)
    }).then((isEncrypted) => {
      if (isEncrypted) {
        return unzipWithPassword(filePath, unzipPath, password)
      } else {
        throw 'Not password protected!'
      }
    }).then((response) => {
      console.log('Successfully unzipped files')
      console.log(response)
      this.setState({
        ...this.state,
        uri: `file://${unzipPath}/static_password/index.html`
      })
    }).catch((err) => {
      console.log(err)
    })
  }

  render () {
    const { uri } = this.state
    if (uri !== '') {
      // render the extracted html file
      return (
        <WebView
          source={{uri: uri}}
          style={styles.webView}
          originWhitelist={['http://*', 'https://*', 'file://*']}
          startInLoadingState={true}
          scalesPageToFit={true}
          allowFileAccess={true}
        />
      )
    }

    return (
      <View style={styles.contentContainer}>
        <AwesomeButtonRick
          borderRadius={8}
          width={300}
          textSize={22}
          type="primary"
          onPress = {() => this.openLink()}>
            Download Sample Zip file
        </AwesomeButtonRick>

        <View style = {styles.lineStyle} />

        <AwesomeButtonRick
          borderRadius={8}
          width={300}
          textSize={22}
          onPress = {() => this.browseFiles()}
          type="secondary">
            Browse files
        </AwesomeButtonRick>

        <View style = {styles.lineStyle} />

        <AwesomeButtonRick
          width={300}
          borderRadius={8}
          textSize={22}
          onPress = {() => this.extractFile()}
          type="anchor">
            Extract
        </AwesomeButtonRick>
      </View>

    )
  }
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  lineStyle: {
    borderWidth: 0.5,
    borderColor: 'black',
    margin: 10
  },
  webView: {
    flex: 1,
    marginTop: 20
  }
})
