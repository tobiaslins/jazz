import { metrics } from "@opentelemetry/api";
import {
  AggregationTemporality,
  InMemoryMetricExporter,
  MeterProvider,
  MetricReader,
} from "@opentelemetry/sdk-metrics";
import { expect, onTestFinished, vi } from "vitest";
import { ControlledAgent } from "../coValues/account.js";
import { WasmCrypto } from "../crypto/WasmCrypto.js";
import type { CoID, RawCoValue } from "../exports.js";
import type { SessionID } from "../ids.js";
import { LocalNode } from "../localNode.js";
import { connectedPeers } from "../streamUtils.js";
import type { Peer, SyncMessage } from "../sync.js";
import { expectGroup } from "../typeUtils/expectGroup.js";

const Crypto = await WasmCrypto.create();

const syncServer: {
  current: undefined | LocalNode;
} = {
  current: undefined,
};

export function randomAnonymousAccountAndSessionID(): [
  ControlledAgent,
  SessionID,
] {
  const agentSecret = Crypto.newRandomAgentSecret();

  const sessionID = Crypto.newRandomSessionID(Crypto.getAgentID(agentSecret));

  return [new ControlledAgent(agentSecret, Crypto), sessionID];
}

export function createTestNode() {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  return new LocalNode(admin, session, Crypto);
}

export async function createTwoConnectedNodes(
  node1Role: Peer["role"],
  node2Role: Peer["role"],
) {
  // Connect nodes initially
  const [node1ToNode2Peer, node2ToNode1Peer] = connectedPeers(
    "node1ToNode2",
    "node2ToNode1",
    {
      peer1role: node2Role,
      peer2role: node1Role,
    },
  );

  const node1 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node1ToNode2Peer],
    crypto: Crypto,
    creationProps: { name: "Client" },
  });

  const node2 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node2ToNode1Peer],
    crypto: Crypto,
    creationProps: { name: "Server" },
  });

  return {
    node1,
    node2,
    node1ToNode2Peer,
    node2ToNode1Peer,
  };
}

export async function createThreeConnectedNodes(
  node1Role: Peer["role"],
  node2Role: Peer["role"],
  node3Role: Peer["role"],
) {
  const [node1ToNode2Peer, node2ToNode1Peer] = connectedPeers(
    "node1ToNode2",
    "node2ToNode1",
    {
      peer1role: node2Role,
      peer2role: node1Role,
    },
  );

  const [node1ToNode3Peer, node3ToNode1Peer] = connectedPeers(
    "node1ToNode3",
    "node3ToNode1",
    {
      peer1role: node3Role,
      peer2role: node1Role,
    },
  );

  const [node2ToNode3Peer, node3ToNode2Peer] = connectedPeers(
    "node2ToNode3",
    "node3ToNode2",
    {
      peer1role: node3Role,
      peer2role: node2Role,
    },
  );

  const node1 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node1ToNode2Peer, node1ToNode3Peer],
    crypto: Crypto,
    creationProps: { name: "Node 1" },
  });

  const node2 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node2ToNode1Peer, node2ToNode3Peer],
    crypto: Crypto,
    creationProps: { name: "Node 2" },
  });

  const node3 = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [node3ToNode1Peer, node3ToNode2Peer],
    crypto: Crypto,
    creationProps: { name: "Node 3" },
  });

  return {
    node1,
    node2,
    node3,
    node1ToNode2Peer,
    node2ToNode1Peer,
    node1ToNode3Peer,
    node3ToNode1Peer,
    node2ToNode3Peer,
    node3ToNode2Peer,
  };
}

export function connectTwoPeers(
  a: LocalNode,
  b: LocalNode,
  aRole: "client" | "server",
  bRole: "client" | "server",
) {
  const [aAsPeer, bAsPeer] = connectedPeers(
    "peer:" + a.account.id,
    "peer:" + b.account.id,
    {
      peer1role: aRole,
      peer2role: bRole,
    },
  );

  a.syncManager.addPeer(bAsPeer);
  b.syncManager.addPeer(aAsPeer);
}

export function newGroup() {
  const [admin, sessionID] = randomAnonymousAccountAndSessionID();

  const node = new LocalNode(admin, sessionID, Crypto);

  const groupCore = node.createCoValue({
    type: "comap",
    ruleset: { type: "group", initialAdmin: admin.id },
    meta: null,
    ...Crypto.createdNowUnique(),
  });

  const group = expectGroup(groupCore.getCurrentContent());

  group.set(admin.id, "admin", "trusting");
  expect(group.get(admin.id)).toEqual("admin");

  return { node, groupCore, admin };
}

export function groupWithTwoAdmins() {
  const { groupCore, admin, node } = newGroup();

  const otherAdmin = node.createAccount();

  const group = expectGroup(groupCore.getCurrentContent());

  group.set(otherAdmin.id, "admin", "trusting");
  expect(group.get(otherAdmin.id)).toEqual("admin");

  if (group.type !== "comap") {
    throw new Error("Expected map");
  }

  expect(group.get(otherAdmin.id)).toEqual("admin");
  return { group, groupCore, admin, otherAdmin, node };
}

export function newGroupHighLevel() {
  const [admin, sessionID] = randomAnonymousAccountAndSessionID();

  const node = new LocalNode(admin, sessionID, Crypto);

  const group = node.createGroup();

  onTestFinished(() => {
    node.gracefulShutdown();
  });
  return { admin, node, group };
}

export function groupWithTwoAdminsHighLevel() {
  const { admin, node, group } = newGroupHighLevel();

  const otherAdmin = node.createAccount();

  group.addMember(otherAdmin, "admin");

  return { admin, node, group, otherAdmin };
}

export function shouldNotResolve<T>(
  promise: Promise<T>,
  ops: { timeout: number },
): Promise<void> {
  return new Promise((resolve, reject) => {
    promise
      .then((v) =>
        reject(
          new Error(
            "Should not have resolved, but resolved to " + JSON.stringify(v),
          ),
        ),
      )
      .catch(reject);
    setTimeout(resolve, ops.timeout);
  });
}

export function waitFor(callback: () => boolean | void) {
  return new Promise<void>((resolve, reject) => {
    const checkPassed = () => {
      try {
        return { ok: callback(), error: null };
      } catch (error) {
        return { ok: false, error };
      }
    };

    let retries = 0;

    const interval = setInterval(() => {
      const { ok, error } = checkPassed();

      if (ok !== false) {
        clearInterval(interval);
        resolve();
      }

      if (++retries > 10) {
        clearInterval(interval);
        reject(error);
      }
    }, 100);
  });
}

export async function loadCoValueOrFail<V extends RawCoValue>(
  node: LocalNode,
  id: CoID<V>,
): Promise<V> {
  const value = await node.load(id);
  if (value === "unavailable") {
    throw new Error("CoValue not found");
  }
  return value;
}

export function blockMessageTypeOnOutgoingPeer(
  peer: Peer,
  messageType: SyncMessage["action"],
) {
  const push = peer.outgoing.push;
  const pushSpy = vi.spyOn(peer.outgoing, "push");

  const blockedMessages: SyncMessage[] = [];

  pushSpy.mockImplementation(async (msg) => {
    if (msg.action === messageType) {
      blockedMessages.push(msg);
      return Promise.resolve();
    }

    return push.call(peer.outgoing, msg);
  });

  return {
    sendBlockedMessages: async () => {
      for (const msg of blockedMessages) {
        await push.call(peer.outgoing, msg);
      }
      blockedMessages.length = 0;
    },
    unblock: () => pushSpy.mockRestore(),
  };
}

export function hotSleep(ms: number) {
  const before = Date.now();
  while (Date.now() < before + ms) {
    /* hot sleep */
  }
  return before;
}

/**
 * This is a test metric reader that uses an in-memory metric exporter and exposes a method to get the value of a metric given its name and attributes.
 *
 * This is useful for testing the values of metrics that are collected by the SDK.
 *
 * TODO: We may want to rethink how we access metrics (see `getMetricValue` method) to make it more flexible.
 */
class TestMetricReader extends MetricReader {
  private _exporter = new InMemoryMetricExporter(
    AggregationTemporality.CUMULATIVE,
  );

  protected onShutdown(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  protected onForceFlush(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async getMetricValue(
    name: string,
    attributes: { [key: string]: string | number } = {},
  ) {
    await this.collectAndExport();
    const metric = this._exporter
      .getMetrics()[0]
      ?.scopeMetrics[0]?.metrics.find((m) => m.descriptor.name === name);

    const dp = metric?.dataPoints.find(
      (dp) => JSON.stringify(dp.attributes) === JSON.stringify(attributes),
    );

    this._exporter.reset();

    return dp?.value;
  }

  async collectAndExport(): Promise<void> {
    const result = await this.collect();
    await new Promise<void>((resolve, reject) => {
      this._exporter.export(result.resourceMetrics, (result) => {
        if (result.error != null) {
          reject(result.error);
        } else {
          resolve();
        }
      });
    });
  }
}

export function createTestMetricReader() {
  const metricReader = new TestMetricReader();
  const success = metrics.setGlobalMeterProvider(
    new MeterProvider({
      readers: [metricReader],
    }),
  );

  expect(success).toBe(true);

  return metricReader;
}

export function tearDownTestMetricReader() {
  metrics.disable();
}

export function setupSyncServer() {
  const [admin, session] = randomAnonymousAccountAndSessionID();
  let node = (syncServer.current = new LocalNode(admin, session, Crypto));

  return {
    node,
    restart: () => {
      node.gracefulShutdown();
      node = syncServer.current = new LocalNode(admin, session, Crypto);
    },
  };
}

export async function createConnectedTestAgentNode(opts = { connected: true }) {
  if (!syncServer.current) {
    throw new Error("Sync server not initialized");
  }

  const [admin, session] = randomAnonymousAccountAndSessionID();
  const node = new LocalNode(admin, session, Crypto);

  const { nodeToServerPeer, serverToNodePeer, messages, addServerPeer } =
    connectNodeToSyncServer(node, opts.connected);

  const createNewNode = () => {
    return new LocalNode(admin, session, Crypto);
  };

  return {
    node,
    nodeToServerPeer,
    serverToNodePeer,
    messages,
    addServerPeer,
    createNewNode,
  };
}

export async function createConnectedTestNode(opts = { connected: true }) {
  if (!syncServer.current) {
    throw new Error("Sync server not initialized");
  }

  const ctx = await LocalNode.withNewlyCreatedAccount({
    peersToLoadFrom: [],
    crypto: Crypto,
    creationProps: { name: "Client" },
  });

  const { nodeToServerPeer, serverToNodePeer, messages, addServerPeer } =
    connectNodeToSyncServer(ctx.node, opts.connected);

  return {
    node: ctx.node,
    accountID: ctx.accountID,
    nodeToServerPeer,
    serverToNodePeer,
    messages,
    addServerPeer,
  };
}

export function connectedPeersWithMessagesTracking(opts: {
  initialMessages?: {
    from: Peer["role"];
    to: Peer["role"];
    msg: SyncMessage;
  }[];
  peer1: { id: string; role: Peer["role"] };
  peer2: { id: string; role: Peer["role"] };
}) {
  const [peer1, peer2] = connectedPeers(opts.peer1.id, opts.peer2.id, {
    peer1role: opts.peer1.role,
    peer2role: opts.peer2.role,
  });

  const messages = opts.initialMessages ?? [];

  const peer1Push = peer1.outgoing.push;
  peer1.outgoing.push = (msg) => {
    messages.push({ from: opts.peer2.role, to: opts.peer1.role, msg });
    return peer1Push.call(peer1.outgoing, msg);
  };

  const peer2Push = peer2.outgoing.push;
  peer2.outgoing.push = (msg) => {
    messages.push({ from: opts.peer1.role, to: opts.peer2.role, msg });
    return peer2Push.call(peer2.outgoing, msg);
  };

  return {
    peer1,
    peer2,
    messages,
  };
}

export function connectNodeToSyncServer(
  node: LocalNode,
  connected = true,
  initialMessages?: {
    from: Peer["role"];
    to: Peer["role"];
    msg: SyncMessage;
  }[],
) {
  if (!syncServer.current) {
    throw new Error("Sync server not initialized");
  }

  const { peer1, peer2, messages } = connectedPeersWithMessagesTracking({
    peer1: {
      id: "syncServer (" + syncServer.current.account.id + ")",
      role: "server",
    },
    peer2: { id: "client (" + node.account.id + ")", role: "client" },
    initialMessages,
  });

  syncServer.current.syncManager.addPeer(peer2);
  if (connected) {
    node.syncManager.addPeer(peer1);
  }

  return {
    nodeToServerPeer: peer1,
    serverToNodePeer: peer2,
    closeConnection: () => {
      node.syncManager.peers[peer1.id]?.gracefulShutdown();
    },
    messages,
    addServerPeer: () => node.syncManager.addPeer(peer1),
  };
}

export function connectToStoragePeer(
  node: LocalNode,
  initialMessages?: {
    from: Peer["role"];
    to: Peer["role"];
    msg: SyncMessage;
  }[],
) {
  const storage = createTestNode();

  const { peer1, peer2, messages } = connectedPeersWithMessagesTracking({
    peer1: { id: storage.account.id, role: "storage" },
    peer2: { id: node.account.id, role: "client" },
    initialMessages,
  });

  peer1.priority = 100;

  node.syncManager.addPeer(peer1);
  storage.syncManager.addPeer(peer2);

  return {
    storage,
    nodeToStoragePeer: peer1,
    storageToNodePeer: peer2,
    messages,
  };
}
