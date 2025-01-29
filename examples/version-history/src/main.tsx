import { DemoAuthBasicUI, JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider
      sync={{
        peer: "wss://cloud.jazz.tools/?key=version-history@garden.co",
        when: "signedUp",
      }}
    >
      <DemoAuthBasicUI appName="Jazz Version History Example">
        <App />
      </DemoAuthBasicUI>
    </JazzProvider>
  </StrictMode>,
);
