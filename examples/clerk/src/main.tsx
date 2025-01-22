import { ClerkProvider, SignInButton, useClerk } from "@clerk/clerk-react";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { JazzProvider, useIsAnonymousUser } from "jazz-react";

// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk publishable key to the .env.local file");
}

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  useJazzClerkAuth(clerk);

  const isAnonymous = useIsAnonymousUser();

  return (
    <main className="container">
      {isAnonymous ? <SignInButton /> : children}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <JazzProvider
      localOnly="anonymous"
      peer="wss://cloud.jazz.tools/?key=minimal-auth-clerk-example@garden.co"
    >
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <JazzAndAuth>
          <App />
        </JazzAndAuth>
      </ClerkProvider>
    </JazzProvider>
  </StrictMode>,
);
