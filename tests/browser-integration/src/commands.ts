/// <reference types="@vitest/browser/providers/playwright" />

import { startSyncServer } from "jazz-run/startSyncServer";
import type { BrowserCommand } from "vitest/node";

let lastSyncServerUrl: `ws://localhost:${number}` = `ws://localhost:0`;

const startSyncServerCommand: BrowserCommand<
  [arg1: string, arg2: string]
> = async () => {
  const server = await startSyncServer({
    port: "0",
    inMemory: true,
    db: "sqlite",
  });

  const port = (server.address() as { port: number }).port;

  lastSyncServerUrl = `ws://localhost:${port}`;

  return {
    url: `ws://localhost:${port}`,
  };
};

declare module "@vitest/browser/context" {
  interface BrowserCommands {
    startSyncServer: () => Promise<{
      url: `ws://localhost:${number}`;
    }>;
  }
}

export const customCommands = {
  startSyncServer: startSyncServerCommand,
};
