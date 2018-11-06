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
import UnzipApp from './UnzipApp'

export default class example extends Component {

  constructor() {
    super()
    this.state = {
      unzipWithPassword: true
    }
  }

  render () {
    return (
      <View style={styles.container}>
        {this.state.unzipWithPassword ? (<UnzipApp />) : (<App />)}
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
