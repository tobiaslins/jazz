import { JazzInspector } from "jazz-tools/inspector";
import { JazzProvider } from "jazz-tools/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { apiKey } from "./apiKey.ts";
import { CursorAccount } from "./schema.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider
      sync={{
        peer: `wss://cloud.jazz.tools/?key=${apiKey}`,
        when: "always",
      }}
      AccountSchema={CursorAccount}
    >
      <App />
      <JazzInspector />
    </JazzProvider>
  </StrictMode>,
);
