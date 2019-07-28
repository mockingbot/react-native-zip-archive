import React, { Component } from 'react'
import {
  StyleSheet, View,
  Alert, Platform
} from 'react-native'
import WebView from 'react-native-webview'
import {
  ANIMATIONS_SLIDE,
  CustomTabs
} from 'react-native-custom-tabs'
import AwesomeButtonRick from 'react-native-really-awesome-button/src/themes/rick'
import { DocumentPicker } from 'react-native-document-picker'
import { copyFile, DocumentDirectoryPath, unlink } from 'react-native-fs'
import { subscribe, unzip, unzipWithPassword, isPasswordProtected, zipWithPassword } from 'react-native-zip-archive'

export default class App extends Component {
  constructor (props) {
    super(props)
    this.state = {
      fileDetails: {}, // no browsed file yet
      uri: '' // the extracted file will be used as a uri
    }
  }

  /**
   * box to download a sample password protected html file
   */
  openLink (isPasswordProtected) {
    const url = isPasswordProtected
      ? 'https://app.box.com/s/2szqk4fzsq7brrbcnuk6z2tdl6jq2rts'
      : 'https://app.box.com/s/ndkn0exa9zmuh9ki7qpjgakvbkrn98q7'
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
      filetype: [(Platform.OS === 'android') ? '*/*' : 'public.data']
    }, (err, response) => {
      if (err) {
        console.error(err)
      }
      const fileDetails = {
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
    const fileDetails = this.state.fileDetails
    if (Object.keys(fileDetails).length === 0) {
      Alert.alert('No file selected!')
      return
    }

    // password for the dropbox sample zip file
    const password = 'helloworld'

    const filename = fileDetails.name
    const filePath = DocumentDirectoryPath + '/' + filename
    const unzipPath = DocumentDirectoryPath
    return unlink(filePath).catch(err => {
      console.log(err)
      return Promise.resolve()
    }).then(() => {
      return copyFile(fileDetails.uri, filePath)
    }).then(() => {
      return isPasswordProtected(filePath)
    }).then((isEncrypted) => {
      if (isEncrypted) {
        return unzipWithPassword(filePath, unzipPath, password)
      } else {
        return unzip(filePath, unzipPath)
      }
    }).then((response) => {
      console.log('Successfully unzipped files')
      console.log(response)
      return filePath
    }).catch((err) => {
      console.log(err)
    })
  }

  archiveFolder () {
    this.extractFile().then((filePath) => {
      return unlink(filePath).then(() => {
        // password for the dropbox sample zip file
        const password = 'helloworld'

        return zipWithPassword(
          filePath.split('.').slice(0, -1).join('.'),
          filePath,
          password
        ).then((response) => {
          console.log('Successfully archived the folder')
          console.log(response)
        }).catch((err) => {
          console.log(err)
        })
      }).catch((err) => {
        console.log(err)
      })
    }).catch((err) => {
      console.log(err)
    })
  }

  extractFileAndShow () {
    this.extractFile().then(filePath => {
      this.setState({
        uri: `file://${filePath.split('.').slice(0, -1).join('.')}/index.html`
      })
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
          textSize={14}
          type="primary"
          onPress = {() => this.openLink(true)}>
            Download Sample Zip file with password
        </AwesomeButtonRick>

        <View style = {styles.lineStyle} />

        <AwesomeButtonRick
          borderRadius={8}
          width={300}
          textSize={14}
          type="primary"
          onPress = {() => this.openLink(false)}>
            Download Sample Zip file without password
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
          onPress = {() => this.extractFileAndShow()}
          type="anchor">
            Extract
        </AwesomeButtonRick>

        <View style = {styles.lineStyle} />

        <AwesomeButtonRick
          width={300}
          borderRadius={8}
          textSize={22}
          onPress = {() => this.archiveFolder()}
          type="anchor">
            Archive
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
