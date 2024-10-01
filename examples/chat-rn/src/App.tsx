import React, { StrictMode } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import {
    useDemoAuth,
    DemoAuthBasicUI,
    createJazzRNApp,
} from "jazz-react-native";
import ChatScreen from "./chat";

const Stack = createNativeStackNavigator();
const Jazz = createJazzRNApp();

export const { useAccount, useCoState } = Jazz;

function App() {
    const [auth, state] = useDemoAuth();

    return (
        <StrictMode>
            <Jazz.Provider
                auth={auth}
                peer="wss://mesh.jazz.tools/?key=chat-rn-example-jazz@gcmp.io"
                storage={undefined}
            >
                <NavigationContainer>
                    <Stack.Navigator initialRouteName="ChatScreen">
                        <Stack.Screen
                            name="ChatScreen"
                            component={ChatScreen}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </Jazz.Provider>
            <DemoAuthBasicUI appName="Jazz Chat" state={state} />
        </StrictMode>
    );
}

export default App;