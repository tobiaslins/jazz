import { commands } from "@vitest/browser/context";
import { beforeAll } from "vitest";

beforeAll(async () => {
  const { url } = await commands.startSyncServer();

  globalThis.SYNC_SERVER_URL = url;
});

declare global {
  var SYNC_SERVER_URL: `ws://localhost:${number}`;
}
