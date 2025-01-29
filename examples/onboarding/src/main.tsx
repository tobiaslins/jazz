import App from "@/App.tsx";
import "@/index.css";
import { HRAccount } from "@/schema.ts";
import { JazzProvider } from "jazz-react";
import React from "react";
import ReactDOM from "react-dom/client";

const peer =
  (new URL(window.location.href).searchParams.get(
    "peer",
  ) as `ws://${string}`) ??
  "wss://cloud.jazz.tools/?key=onboarding-example-jazz@garden.co";

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider AccountSchema={HRAccount} peer={peer}>
      {children}
    </JazzProvider>
  );
}

declare module "jazz-react" {
  interface Register {
    Account: HRAccount;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </React.StrictMode>,
);
