import { JazzProvider } from "jazz-react";
export function JazzAndAuth({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      localOnly="anonymous"
      peer="wss://cloud.jazz.tools/?key=chat-example-jazz@garden.co"
    >
      {children}
    </JazzProvider>
  );
}
