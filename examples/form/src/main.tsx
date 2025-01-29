import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { JazzAccount } from "./schema.ts";

declare module "jazz-react" {
  interface Register {
    Account: JazzAccount;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider
      peer="wss://cloud.jazz.tools/?key=form-example@garden.co"
      AccountSchema={JazzAccount}
    >
      <App />
    </JazzProvider>
  </StrictMode>,
);
