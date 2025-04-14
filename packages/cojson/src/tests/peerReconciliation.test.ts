import { assert, beforeEach, describe, expect, test } from "vitest";
import { expectMap } from "../coValue";
import { WasmCrypto } from "../crypto/WasmCrypto";
import { LocalNode } from "../localNode";
import {
  connectNodeToSyncServer,
  createConnectedTestAgentNode,
  createTestNode,
  loadCoValueOrFail,
  randomAnonymousAccountAndSessionID,
  setupSyncServer,
  waitFor,
} from "./testUtils";

const Crypto = await WasmCrypto.create();

let jazzCloud = setupSyncServer();

beforeEach(async () => {
  jazzCloud = setupSyncServer();
});

describe("peer reconciliation", () => {
  test("handle new peer connections", async () => {
    const node = createTestNode();

    const group = node.createGroup();
    const map = group.createMap();

    map.set("hello", "world", "trusting");

    const { messages } = connectNodeToSyncServer(node, true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    await map.core.waitForSync();

    expect(messages).toEqual([
      {
        from: "client",
        msg: {
          action: "load",
          ...group.core.knownState(),
        },
      },
      {
        from: "server",
        msg: {
          action: "known",
          header: false,
          id: group.id,
          sessions: {},
        },
      },
      {
        from: "client",
        msg: {
          action: "known",
          asDependencyOf: undefined,
          ...group.core.knownState(),
        },
      },
      {
        from: "client",
        msg: {
          action: "load",
          ...map.core.knownState(),
        },
      },
      {
        from: "server",
        msg: {
          action: "known",
          header: false,
          id: map.id,
          sessions: {},
        },
      },
      {
        from: "client",
        msg: group.core.newContentSince(undefined)?.[0],
      },
      {
        from: "server",
        msg: {
          action: "known",
          ...group.core.knownState(),
        },
      },
      {
        from: "client",
        msg: {
          action: "known",
          asDependencyOf: undefined,
          ...map.core.knownState(),
        },
      },
      {
        from: "client",
        msg: map.core.newContentSince(undefined)?.[0],
      },
      {
        from: "server",
        msg: {
          action: "known",
          ...map.core.knownState(),
        },
      },
    ]);
  });

  test("handle peer reconnections", async () => {
    const node = createTestNode();

    const group = node.createGroup();

    const map = group.createMap();

    map.set("hello", "world", "trusting");

    connectNodeToSyncServer(node, true);

    await map.core.waitForSync();

    node.syncManager.getPeers()[0]?.gracefulShutdown();

    const knownStateBefore = map.core.knownState();

    map.set("hello", "updated", "trusting");

    const { messages } = connectNodeToSyncServer(node, true);

    await map.core.waitForSync();

    const mapOnSyncServer = jazzCloud.coValuesStore.get(map.id);

    assert(mapOnSyncServer.state.type === "available");

    expect(
      expectMap(mapOnSyncServer.state.coValue.getCurrentContent()).get("hello"),
    ).toEqual("updated");

    expect(messages).toEqual([
      {
        from: "client",
        msg: {
          action: "load",
          ...group.core.knownState(),
        },
      },
      {
        from: "server",
        msg: {
          action: "known",
          asDependencyOf: undefined,
          ...group.core.knownState(),
        },
      },
      {
        from: "client",
        msg: {
          action: "load",
          ...map.core.knownState(),
        },
      },
      {
        from: "client",
        msg: {
          action: "known",
          asDependencyOf: undefined,
          ...group.core.knownState(),
        },
      },
      {
        from: "server",
        msg: {
          action: "known",
          asDependencyOf: undefined,
          ...knownStateBefore,
        },
      },
      {
        from: "client",
        msg: {
          action: "known",
          asDependencyOf: undefined,
          ...map.core.knownState(),
        },
      },
      {
        from: "client",
        msg: {
          action: "content",
          ...map.core.newContentSince(knownStateBefore)?.[0],
        },
      },
      {
        from: "server",
        msg: {
          action: "known",
          ...map.core.knownState(),
        },
      },
    ]);
  });

  test("correctly handle concurrent peer reconnections", async () => {
    const [admin, session] = randomAnonymousAccountAndSessionID();
    const node = new LocalNode(admin, session, Crypto);

    const group = node.createGroup();
    const map = group.createMap();

    map.set("hello", "world", "trusting");

    connectNodeToSyncServer(node, true);

    await map.core.waitForSync();

    node.syncManager.getPeers()[0]?.gracefulShutdown();

    map.set("hello", "updated", "trusting");

    const { nodeToServerPeer: stalePeer } = connectNodeToSyncServer(node, true);
    const { nodeToServerPeer: latestPeer } = connectNodeToSyncServer(
      node,
      true,
    );

    await map.core.waitForSync();

    const mapOnSyncServer = jazzCloud.coValuesStore.get(map.id);

    assert(mapOnSyncServer.state.type === "available");

    expect(
      expectMap(mapOnSyncServer.state.coValue.getCurrentContent()).get("hello"),
    ).toEqual("updated");

    expect(stalePeer.outgoing).toMatchObject({
      closed: true,
    });

    expect(latestPeer.outgoing).toMatchObject({
      closed: false,
    });
  });

  test.skip("handle peer reconnections with data loss", async () => {
    const node = createTestNode();

    const group = node.createGroup();
    const map = group.createMap();

    map.set("hello", "world", "trusting");

    connectNodeToSyncServer(node, true);

    await map.core.waitForSync();

    node.syncManager.getPeers()[0]?.gracefulShutdown();

    jazzCloud.coValuesStore.coValues.delete(map.id); // Simulate data loss

    const { messages } = connectNodeToSyncServer(node, true);
    const mapOnSyncServer = jazzCloud.coValuesStore.get(map.id);

    await waitFor(() => {
      console.log(messages);
      expect(mapOnSyncServer.state.type).toBe("available");
    });

    assert(mapOnSyncServer.state.type === "available");

    expect(
      expectMap(mapOnSyncServer.state.coValue.getCurrentContent()).get("hello"),
    ).toEqual("updated");
  });
});
