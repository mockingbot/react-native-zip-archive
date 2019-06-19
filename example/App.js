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
import Example from './Example'

export default class App extends Component {
  render () {
    return (
      <View style={styles.container}>
        <Example />
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

AppRegistry.registerComponent('app', () => App)
