import { JazzProvider, PasskeyAuthBasicUI } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider
      sync={{
        peer: "wss://cloud.jazz.tools/?key=reactions-example@garden.co",
        when: "signedUp",
      }}
    >
      <PasskeyAuthBasicUI appName="Jazz Reactions Example">
        <App />
      </PasskeyAuthBasicUI>
    </JazzProvider>
  </StrictMode>,
);
