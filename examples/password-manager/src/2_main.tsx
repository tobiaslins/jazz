import { JazzProvider, PasskeyAuthBasicUI } from "jazz-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { PasswordManagerAccount } from "./1_schema.ts";
import App from "./5_App.tsx";
import "./index.css";

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      AccountSchema={PasswordManagerAccount}
      sync={{
        peer: "wss://cloud.jazz.tools/?key=password-manager-example-jazz@garden.co",
        when: "signedUp",
      }}
    >
      <PasskeyAuthBasicUI appName="Jazz Password Manager">
        {children}
      </PasskeyAuthBasicUI>
    </JazzProvider>
  );
}

declare module "jazz-react" {
  interface Register {
    Account: PasswordManagerAccount;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </React.StrictMode>,
);
