import { useClerk } from "@clerk/clerk-expo";
import { JazzProviderWithClerk } from "jazz-react-native-auth-clerk";
import React, { PropsWithChildren } from "react";

export function JazzAndAuth({ children }: PropsWithChildren) {
  const clerk = useClerk();

  return (
    <JazzProviderWithClerk
      clerk={clerk}
      storage="sqlite"
      peer="wss://cloud.jazz.tools/?key=chat-rn-clerk-example-jazz@garden.co"
    >
      {children}
    </JazzProviderWithClerk>
  );
}
