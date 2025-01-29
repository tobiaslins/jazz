import { JazzProvider, PasskeyAuthBasicUI, usePasskeyAuth } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const auth = usePasskeyAuth({
    appName: "Jazz Minimal Auth Passkey Example",
  });

  return (
    <JazzProvider peer="wss://cloud.jazz.tools/?key=minimal-auth-passkey-example@garden.co">
      <PasskeyAuthBasicUI {...auth} />
      {children}
    </JazzProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzAndAuth>
      <App />
    </JazzAndAuth>
  </StrictMode>,
);
