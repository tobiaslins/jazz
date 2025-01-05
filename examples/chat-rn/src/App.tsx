import "../global.css";

import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React, { StrictMode, useEffect, useState } from "react";
import HandleInviteScreen from "./invite";

import { SQLiteStorage } from "cojson-storage-rn-sqlite";
import { DemoAuthBasicUI, useDemoAuth } from "jazz-react-native";
import { Peer } from "jazz-tools";
import ChatScreen from "./chat";
import { Jazz } from "./jazz";

const Stack = createNativeStackNavigator();

const prefix = Linking.createURL("/");

const linking = {
  prefixes: [prefix],
  config: {
    screens: {
      HandleInviteScreen: {
        path: "router/invite/:valueHint?/:valueID/:inviteSecret",
      },
    },
  },
};

function App() {
  const [auth, state] = useDemoAuth();
  const [initialRoute, setInitialRoute] = useState<
    "ChatScreen" | "HandleInviteScreen"
  >("ChatScreen");
  const navigationRef = useNavigationContainerRef();
  const [peers, setPeers] = useState<Peer[]>([]);
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        if (url && url.includes("invite")) {
          setInitialRoute("HandleInviteScreen");
        }
      }
    });

    console.log("App constructor");

    SQLiteStorage.asPeer({
      filename: "abc333",
      trace: false,
    })
      .then((peer) => {
        console.log("asPeereeeee", peer);
        setPeers([peer]);
      })
      .catch((e) => {
        console.error("Error in asPeer", e);
      });
  }, []);

  if (!auth || peers.length === 0) {
    return null;
  }

  return (
    <StrictMode>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=chat-rn-example-jazz@garden.co"
        peers={peers}
      >
        <NavigationContainer linking={linking} ref={navigationRef}>
          <Stack.Navigator initialRouteName={initialRoute}>
            <Stack.Screen
              options={{ title: "Jazz Chat" }}
              name="ChatScreen"
              // @ts-ignore
              component={ChatScreen}
            />
            <Stack.Screen
              name="HandleInviteScreen"
              component={HandleInviteScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </Jazz.Provider>
      {state.state !== "signedIn" ? (
        <DemoAuthBasicUI appName="Jazz Chat" state={state} />
      ) : null}
    </StrictMode>
  );
}

export default App;
