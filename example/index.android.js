/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react'
import {
  AppRegistry,
  StyleSheet,
  View
} from 'react-native'
import App from './App'

export default class example extends Component {
  render () {
    return (
      <View style={styles.container}>
        <App />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch'
  }
})

AppRegistry.registerComponent('example', () => example)
