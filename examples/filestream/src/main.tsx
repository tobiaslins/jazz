import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { JazzAccount } from "./schema.ts";

// We use this to identify the app in the passkey auth
export const APPLICATION_NAME = "Jazz File Stream Example";

declare module "jazz-react" {
  export interface Register {
    Account: JazzAccount;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider
      sync={{
        peer: "ws://127.0.0.1:4300/?key=react-filestream-example@garden.co",
        //peer: "wss://cloud.jazz.tools/?key=react-filestream-example@garden.co",
      }}
      AccountSchema={JazzAccount}
    >
      <App />
    </JazzProvider>
  </StrictMode>,
);
