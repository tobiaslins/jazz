import { beforeEach, describe, expect, test } from "vitest";

import { expectMap } from "../coValue";
import { toSimplifiedMessages } from "./messagesTestUtils";
import {
  connectNodeToSyncServer,
  connectToStoragePeer,
  createConnectedTestAgentNode,
  loadCoValueOrFail,
  setupSyncServer,
  waitFor,
} from "./testUtils";

let jazzCloud = setupSyncServer();

beforeEach(async () => {
  jazzCloud = setupSyncServer();
});

describe("sync with storage", () => {
  test("coValue loading (empty storage)", async () => {
    const { node: client, messages } = await createConnectedTestAgentNode();

    connectToStoragePeer(client, messages);

    const group = jazzCloud.node.createGroup();
    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const mapOnClient = await loadCoValueOrFail(client, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    expect(
      toSimplifiedMessages(
        {
          Group: group.core,
          Map: map.core,
        },
        messages,
      ),
    ).toMatchInlineSnapshot(`
      [
        "client -> storage | LOAD Map sessions: empty",
        "storage -> client | KNOWN Map sessions: empty",
        "client -> server | LOAD Map sessions: empty",
        "server -> client | CONTENT Group header: true new: After: 0 New: 3",
        "client -> server | KNOWN Group sessions: header/3",
        "client -> storage | CONTENT Group header: true new: After: 0 New: 3",
        "server -> client | CONTENT Map header: true new: After: 0 New: 1",
        "storage -> client | KNOWN Group sessions: header/3",
        "client -> server | KNOWN Map sessions: header/1",
        "client -> storage | CONTENT Map header: true new: After: 0 New: 1",
        "storage -> client | KNOWN Map sessions: header/1",
      ]
    `);
  });

  test("coValue loading (synced storage)", async () => {
    const { node: client, messages } = await createConnectedTestAgentNode();

    const { storage } = connectToStoragePeer(client, messages);

    // Make all the coValues available to the storage node
    storage.coValuesStore = jazzCloud.node.coValuesStore;

    const group = jazzCloud.node.createGroup();
    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const mapOnClient = await loadCoValueOrFail(client, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    expect(
      toSimplifiedMessages(
        {
          Group: group.core,
          Map: map.core,
        },
        messages,
      ),
    ).toMatchInlineSnapshot(`
      [
        "client -> storage | LOAD Map sessions: empty",
        "storage -> client | CONTENT Group header: true new: After: 0 New: 3",
        "client -> storage | KNOWN Group sessions: header/3",
        "storage -> client | CONTENT Map header: true new: After: 0 New: 1",
        "client -> server | CONTENT Group header: true new: After: 0 New: 3",
        "server -> client | KNOWN Group sessions: header/3",
        "client -> storage | KNOWN Map sessions: header/1",
        "client -> server | LOAD Map sessions: header/1",
        "server -> client | CONTENT Group header: true new: After: 0 New: 3",
        "client -> server | KNOWN Group sessions: header/3",
        "server -> client | KNOWN Map sessions: header/1",
        "client -> server | CONTENT Map header: true new: After: 0 New: 1",
      ]
    `);
  });

  test("coValue with parent groups loading", async () => {
    const { node: client, messages } = await createConnectedTestAgentNode();

    connectToStoragePeer(client, messages);

    const group = jazzCloud.node.createGroup();
    const parentGroup = jazzCloud.node.createGroup();
    parentGroup.addMember("everyone", "reader");

    group.extend(parentGroup);

    const map = group.createMap();
    map.set("hello", "world");

    const mapOnClient = await loadCoValueOrFail(client, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    expect(
      toSimplifiedMessages(
        {
          ParentGroup: parentGroup.core,
          Group: group.core,
          Map: map.core,
        },
        messages,
      ),
    ).toMatchInlineSnapshot(`
      [
        "client -> storage | LOAD Map sessions: empty",
        "storage -> client | KNOWN Map sessions: empty",
        "client -> server | LOAD Map sessions: empty",
        "server -> client | CONTENT ParentGroup header: true new: After: 0 New: 6",
        "client -> server | KNOWN ParentGroup sessions: header/6",
        "client -> storage | CONTENT ParentGroup header: true new: After: 0 New: 6",
        "server -> client | CONTENT Group header: true new: After: 0 New: 5",
        "storage -> client | KNOWN ParentGroup sessions: header/6",
        "client -> server | KNOWN Group sessions: header/5",
        "server -> client | CONTENT Map header: true new: After: 0 New: 1",
        "client -> storage | CONTENT Group header: true new: After: 0 New: 5",
        "storage -> client | KNOWN Group sessions: header/5",
        "client -> server | KNOWN Map sessions: header/1",
        "client -> storage | CONTENT Map header: true new: After: 0 New: 1",
        "storage -> client | KNOWN Map sessions: header/1",
      ]
    `);
  });

  test("updating a coValue while offline", async () => {
    const { node: client } = await createConnectedTestAgentNode();

    const { messages } = connectToStoragePeer(client);

    const group = jazzCloud.node.createGroup();
    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const mapOnClient = await loadCoValueOrFail(client, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    client.syncManager.getPeers()[0]?.gracefulShutdown();

    messages.length = 0; // reset messages
    map.set("hello", "updated", "trusting");

    connectNodeToSyncServer(client, true, messages);

    await map.core.waitForSync();

    expect(mapOnClient.get("hello")).toEqual("updated");

    expect(
      toSimplifiedMessages(
        {
          Group: group.core,
          Map: map.core,
        },
        messages,
      ),
    ).toMatchInlineSnapshot(`
      [
        "client -> server | LOAD Group sessions: header/3",
        "server -> client | KNOWN Group sessions: header/3",
        "client -> server | LOAD Map sessions: header/1",
        "server -> client | CONTENT Map header: false new: After: 1 New: 1",
        "client -> server | KNOWN Map sessions: header/2",
        "client -> storage | CONTENT Map header: false new: After: 1 New: 1",
        "storage -> client | KNOWN Map sessions: header/2",
      ]
    `);
  });
});
