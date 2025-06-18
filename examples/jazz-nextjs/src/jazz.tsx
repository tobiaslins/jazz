"use client";

import { JazzInspector } from "jazz-tools/inspector";
import { JazzProvider } from "jazz-tools/react";

export function Jazz({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      experimental_enableSSR
      sync={{
        peer: `wss://cloud.jazz.tools/`,
      }}
    >
      {children}
      <JazzInspector />
    </JazzProvider>
  );
}
