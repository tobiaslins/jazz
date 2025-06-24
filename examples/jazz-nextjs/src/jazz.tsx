import { JazzInspector } from "jazz-tools/inspector";
import { JazzReactProvider } from "jazz-tools/react";

export function Jazz({ children }: { children: React.ReactNode }) {
  return (
    <JazzReactProvider
      enableSSR
      sync={{
        peer: `wss://cloud.jazz.tools/`,
      }}
    >
      {children}
      <JazzInspector />
    </JazzReactProvider>
  );
}
