import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { ReadableStream } from 'web-streams-polyfill';
globalThis.ReadableStream = ReadableStream as any;

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { createJazzReactContext, DemoAuth } from "jazz-react";
import { PureJSCrypto } from 'jazz-tools';


 
const Jazz = createJazzReactContext({
    auth: DemoAuth({ appName: "Circular" }),
    crypto: new PureJSCrypto(),
    peer: "wss://mesh.jazz.tools/?key=you@example.com", // <- put your email here to get a proper API key later
});

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
