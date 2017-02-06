/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  WebView
} from 'react-native';
import { MainBundlePath, DocumentDirectoryPath } from 'react-native-fs';
import { unzip } from 'react-native-zip-archive';

export default class example extends Component {
  constructor () {
    super();
    this.state = {
      uri: 'https://github.com/plrthink/react-native-zip-archive'
    }
  }

  componentDidMount () {
    const sourcePath = `${MainBundlePath}/static.zip`;
    const targetPath = DocumentDirectoryPath;

    unzip(sourcePath, targetPath)
      .then((path) => {
        console.log(`unzip file to ${path}`);
        this.setState({
          uri: `${path}/static/index.html`
        })
      })
      .catch((error) => {
        console.log(error);
      });
  }

  render() {
    const { uri } = this.state

    return (
      <View style={styles.container}>
        <WebView
          source={{uri: uri}}
          style={styles.webView}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch',
  },
  webView: {
    flex: 1,
    marginTop: 20,
  },
});

AppRegistry.registerComponent('example', () => example);
