import { JazzProvider } from "jazz-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider peer="wss://cloud.jazz.tools/?key=reactions-example@garden.co">
      <App />
    </JazzProvider>
  </StrictMode>,
);
