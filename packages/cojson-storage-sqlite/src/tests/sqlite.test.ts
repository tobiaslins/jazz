import { assert } from "node:console";
import { randomUUID } from "node:crypto";
import { unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ControlledAgent, LocalNode } from "cojson";
import { SyncManager } from "cojson-storage";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import { expect, onTestFinished, test, vi } from "vitest";
import { SQLiteNode } from "../index.js";

const Crypto = await WasmCrypto.create();

async function createSQLiteStorage(defaultDbPath?: string) {
  const dbPath = defaultDbPath ?? join(tmpdir(), `test-${randomUUID()}.db`);

  if (!defaultDbPath) {
    onTestFinished(() => {
      unlinkSync(dbPath);
    });
  }

  return {
    peer: await SQLiteNode.asPeer({
      filename: dbPath,
    }),
    dbPath,
  };
}

test("Should be able to initialize and load from empty DB", async () => {
  const agentSecret = Crypto.newRandomAgentSecret();

  const node = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  node.syncManager.addPeer((await createSQLiteStorage()).peer);

  await new Promise((resolve) => setTimeout(resolve, 200));

  expect(node.syncManager.peers.storage).toBeDefined();
});

test("should sync and load data from storage", async () => {
  const agentSecret = Crypto.newRandomAgentSecret();

  const node1 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  const { peer, dbPath } = await createSQLiteStorage();

  node1.syncManager.addPeer(peer);

  const group = node1.createGroup();

  const map = group.createMap();

  map.set("hello", "world");

  await new Promise((resolve) => setTimeout(resolve, 200));

  const node2 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  const { peer: peer2 } = await createSQLiteStorage(dbPath);

  node2.syncManager.addPeer(peer2);

  const map2 = await node2.load(map.id);
  if (map2 === "unavailable") {
    throw new Error("Map is unavailable");
  }

  expect(map2.get("hello")).toBe("world");
});

test("should load dependencies correctly (group inheritance)", async () => {
  const agentSecret = Crypto.newRandomAgentSecret();

  const node1 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  const { peer, dbPath } = await createSQLiteStorage();

  node1.syncManager.addPeer(peer);

  const group = node1.createGroup();
  const parentGroup = node1.createGroup();

  group.extend(parentGroup);

  const map = group.createMap();

  map.set("hello", "world");

  await new Promise((resolve) => setTimeout(resolve, 200));

  const node2 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  const { peer: peer2 } = await createSQLiteStorage(dbPath);

  node2.syncManager.addPeer(peer2);

  await node2.load(map.id);

  expect(node2.expectCoValueLoaded(map.id)).toBeTruthy();
  expect(node2.expectCoValueLoaded(group.id)).toBeTruthy();
  expect(node2.expectCoValueLoaded(parentGroup.id)).toBeTruthy();
});

test("should recover from data loss", async () => {
  const agentSecret = Crypto.newRandomAgentSecret();

  const node1 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  const { peer, dbPath } = await createSQLiteStorage();

  node1.syncManager.addPeer(peer);

  const group = node1.createGroup();

  const map = group.createMap();

  map.set("0", 0);

  await new Promise((resolve) => setTimeout(resolve, 200));

  const mock = vi
    .spyOn(SyncManager.prototype, "handleSyncMessage")
    .mockImplementation(() => Promise.resolve());

  map.set("1", 1);
  map.set("2", 2);

  await new Promise((resolve) => setTimeout(resolve, 200));

  mock.mockReset();

  map.set("3", 3);

  await new Promise((resolve) => setTimeout(resolve, 200));

  const node2 = new LocalNode(
    new ControlledAgent(agentSecret, Crypto),
    Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret)),
    Crypto,
  );

  const { peer: peer2 } = await createSQLiteStorage(dbPath);

  node2.syncManager.addPeer(peer2);

  const map2 = await node2.load(map.id);

  if (map2 === "unavailable") {
    throw new Error("Map is unavailable");
  }

  expect(map2.toJSON()).toEqual({
    "0": 0,
    "1": 1,
    "2": 2,
    "3": 3,
  });
});
