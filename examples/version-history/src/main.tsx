import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      localOnly="anonymous"
      peer="wss://cloud.jazz.tools/?key=version-history@garden.co"
    >
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
