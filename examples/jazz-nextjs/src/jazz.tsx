"use client";

import { JazzProvider } from "jazz-react";

export function Jazz({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      experimental_enableSSR
      sync={{
        peer: `wss://cloud.jazz.tools/`,
      }}
    >
      {children}
    </JazzProvider>
  );
}
