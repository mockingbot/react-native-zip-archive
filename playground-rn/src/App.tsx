import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import ZipScreen from './screens/ZipScreen';
import UnzipScreen from './screens/UnzipScreen';
import PasswordScreen from './screens/PasswordScreen';
import ProgressScreen from './screens/ProgressScreen';
import BenchmarkScreen from './screens/BenchmarkScreen';
import AssetsScreen from './screens/AssetsScreen';

export type RootStackParamList = {
  Home: undefined;
  Zip: undefined;
  Unzip: undefined;
  Password: undefined;
  Progress: undefined;
  Benchmark: undefined;
  Assets: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Playground' }} />
          <Stack.Screen name="Zip" component={ZipScreen} options={{ title: 'Zip Operations' }} />
          <Stack.Screen name="Unzip" component={UnzipScreen} options={{ title: 'Unzip Operations' }} />
          <Stack.Screen name="Password" component={PasswordScreen} options={{ title: 'Password Protection' }} />
          <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress Events' }} />
          <Stack.Screen name="Benchmark" component={BenchmarkScreen} options={{ title: 'Benchmarks' }} />
          <Stack.Screen name="Assets" component={AssetsScreen} options={{ title: 'Assets' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
