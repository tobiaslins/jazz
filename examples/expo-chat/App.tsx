import "react-native-get-random-values";
import "react-native-url-polyfill/auto";

import {
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { createJazzReactContext, PassphraseAuth } from "jazz-react";
import { Account, CoMap, Group, PureJSCrypto, co } from "jazz-tools";
import { useState } from "react";
import { wordlist } from "@scure/bip39/wordlists/english";

const AuthUI = ({
  logIn,
  signUp,
}: {
  logIn: (passphrase: string) => void;
  signUp: (username: string, passphrase: string) => void;
}) => {
  const [passphrase, setPassphrase] = useState("");
  return (
    <View>
      <TextInput
        style={{ height: 40, borderColor: "gray", borderWidth: 1 }}
        onChangeText={(text) => {
          setPassphrase(text);
        }}
        value={passphrase}
      />
      <Button
        onPress={() => {
          console.log("logging in", passphrase);
          logIn(passphrase);
        }}
        title="Log in"
      />
    </View>
  );
};

export class UserAccountRoot extends CoMap {}
export class PublicProfile extends CoMap {
  name = co.string;
}

export class UserAccount extends Account {
  root = co.ref(UserAccountRoot);
  profile = co.ref(PublicProfile);

  async migrate(this: UserAccount, creationProps?: { name: string }) {
    console.log("running migration", creationProps);

    if (creationProps) {
      const profileGroup = Group.create({ owner: this });
      profileGroup.addMember("everyone", "reader");
      this.profile = PublicProfile.create(
        { name: creationProps.name },
        { owner: profileGroup }
      );
    }

    if (!this._refs.root) {
      this.root = UserAccountRoot.create({}, { owner: this });
      return;
    }
  }
}

const Jazz = createJazzReactContext({
  auth: PassphraseAuth({
    appName: "Circular",
    Component: AuthUI,
    wordlist,
    appHostname: "invoiceradar.com",
    accountSchema: UserAccount,
  }),

  crypto: new PureJSCrypto(),
  // storage: "a",
  peer: "wss://mesh.jazz.tools/?key=you@example.com", // <- put your email here to get a proper API key later
});

class Test extends CoMap {
  name = co.string;
}

function TestJazz() {
  const { me } = Jazz.useAccount();

  return (
    <Text
      style={{
        fontSize: 20,
        color: "blue",
      }}
    >
      Account: {me?.profile?.name}
      {/* <View
        style={{
          display: "flex",
          flexDirection: "column",
        }}
      >
        {me?.root?.organizations?.map((org) => (
          <View>
            <Text key={org?.name}>{org?.name}</Text>
          </View>
        ))}
      </View> */}
    </Text>
  );
}

export default function App() {
  return (
    <SafeAreaView>
      <Jazz.Provider>
        <View style={{}}>
          <TestJazz />
        </View>
      </Jazz.Provider>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 100,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
