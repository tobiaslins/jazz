import { beforeEach, describe, expect, test } from "vitest";
import { setCoValueLoadingRetryDelay } from "../config";
import {
  SyncMessagesLog,
  TEST_NODE_CONFIG,
  blockMessageTypeOnOutgoingPeer,
  connectedPeersWithMessagesTracking,
  getSyncServerConnectedPeer,
  loadCoValueOrFail,
  setupTestAccount,
  setupTestNode,
} from "./testUtils";
import { Peer } from "../exports";
import { ServerPeerSelector } from "../sync";

beforeEach(async () => {
  // We want to simulate a real world communication that happens asynchronously
  TEST_NODE_CONFIG.withAsyncPeers = true;

  SyncMessagesLog.clear();
});

describe("sharding", () => {
  test("server peers are not filtered by default", async () => {
    const { node: client } = setupTestNode({
      connected: false,
    });
    const group = client.createGroup();

    const allPeers: Peer[] = [];
    for (let i = 0; i < 5; i++) {
      const syncServer = await setupTestAccount({ isSyncServer: true });

      const { peer } = getSyncServerConnectedPeer({
        peerId: client.getCurrentAgent().id,
        syncServer: syncServer.node,
      });

      client.syncManager.addPeer(peer);
      allPeers.push(peer);
    }

    const serverPeers = client.syncManager.getServerPeers(group.id);
    expect(serverPeers.map((p) => p.id)).toEqual(allPeers.map((p) => p.id));
  });

  test("server peers are filtered when a serverPeerSelector is set", async () => {
    const firstAlphabetical: ServerPeerSelector = (id, serverPeers) => {
      return serverPeers.sort((a, b) => a.id.localeCompare(b.id)).slice(0, 1);
    };
    const { node: client } = setupTestNode({
      connected: false,
    });
    client.syncManager.serverPeerSelector = firstAlphabetical;
    const group = client.createGroup();

    const allPeers: Peer[] = [];
    for (let i = 0; i < 5; i++) {
      const syncServer = await setupTestAccount({ isSyncServer: true });

      const { peer } = getSyncServerConnectedPeer({
        peerId: client.getCurrentAgent().id,
        syncServer: syncServer.node,
      });

      client.syncManager.addPeer(peer);
      allPeers.push(peer);
    }

    const serverPeers = client.syncManager.getServerPeers(group.id);
    expect(serverPeers.length).toBe(1);
    expect(serverPeers[0]!.id).toEqual(
      allPeers.sort((a, b) => a.id.localeCompare(b.id))[0]!.id,
    );
  });

  test("getPeers respects the serverPeerSelector", async () => {
    const firstPeer: ServerPeerSelector = (id, serverPeers) => {
      return serverPeers.slice(0, 1);
    };
    const { node: edge } = setupTestNode({
      connected: false,
    });
    edge.syncManager.serverPeerSelector = firstPeer;

    // Connect 2 clients to edge
    for (let i = 0; i < 2; i++) {
      const client = await setupTestAccount({});
      const { peer1, peer2 } = connectedPeersWithMessagesTracking({
        peer1: {
          id: client.node.getCurrentAgent().id,
          role: "client",
        },
        peer2: {
          id: edge.getCurrentAgent().id,
          role: "server",
        },
      });

      edge.syncManager.addPeer(peer1);
    }

    // Connect edge to 3 core nodes
    for (let i = 0; i < 3; i++) {
      const syncServer = await setupTestAccount({ isSyncServer: true });

      const { peer } = getSyncServerConnectedPeer({
        peerId: edge.getCurrentAgent().id,
        syncServer: syncServer.node,
      });

      edge.syncManager.addPeer(peer);
    }

    expect(edge.syncManager.getPeers("co_z12345").length).toBe(
      2 + 1, // 2 clients + 1 selected core
    );
  });
});
