import { useClerk } from "@clerk/clerk-expo";
import { JazzProviderWithClerk } from "jazz-react-native-auth-clerk";
import React, { PropsWithChildren } from "react";

export function JazzAndAuth({ children }: PropsWithChildren) {
  const clerk = useClerk();

  return (
    <JazzProviderWithClerk
      clerk={clerk}
      storage="sqlite"
      sync={{
        peer: "wss://cloud.jazz.tools/?key=chat-rn-clerk-example-jazz@garden.co",
        when: "signedUp", // This makes the app work in local mode when the user is not authenticated
      }}
    >
      {children}
    </JazzProviderWithClerk>
  );
}
