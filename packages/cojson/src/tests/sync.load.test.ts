import { assert, beforeEach, describe, expect, test } from "vitest";
import { expectMap } from "../coValue";
import { WasmCrypto } from "../crypto/WasmCrypto";
import { LocalNode } from "../localNode";
import { toSimplifiedMessages } from "./messagesTestUtils";
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

describe("sync protocol", () => {
  test("coValue loading", async () => {
    const { node: client, messages } = await createConnectedTestAgentNode();

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
        "client -> LOAD Map sessions: empty",
        "server -> KNOWN Group sessions: header/3",
        "server -> KNOWN Map sessions: header/1",
        "server -> CONTENT Group header: true new: After: 0 New: 3",
        "client -> KNOWN Group sessions: header/3",
        "server -> CONTENT Map header: true new: After: 0 New: 1",
        "client -> KNOWN Group sessions: header/3",
        "client -> KNOWN Map sessions: header/1",
        "client -> KNOWN Map sessions: header/1",
      ]
    `);
  });

  test("coValue with parent groups loading", async () => {
    const { node: client, messages } = await createConnectedTestAgentNode();

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
        "client -> LOAD Map sessions: empty",
        "server -> KNOWN ParentGroup sessions: header/6",
        "server -> KNOWN Group sessions: header/5",
        "server -> KNOWN Map sessions: header/1",
        "server -> CONTENT ParentGroup header: true new: After: 0 New: 6",
        "client -> KNOWN ParentGroup sessions: header/6",
        "server -> CONTENT Group header: true new: After: 0 New: 5",
        "client -> KNOWN ParentGroup sessions: header/6",
        "server -> CONTENT Map header: true new: After: 0 New: 1",
        "client -> KNOWN Group sessions: header/5",
        "client -> KNOWN Group sessions: header/5",
        "client -> KNOWN Map sessions: header/1",
      ]
    `);
  });

  test("updating a coValue while offline", async () => {
    const { node: client } = await createConnectedTestAgentNode();

    const group = jazzCloud.node.createGroup();
    const map = group.createMap();
    map.set("hello", "world", "trusting");

    const mapOnClient = await loadCoValueOrFail(client, map.id);
    expect(mapOnClient.get("hello")).toEqual("world");

    client.syncManager.getPeers()[0]?.gracefulShutdown();

    map.set("hello", "updated", "trusting");

    const { messages } = connectNodeToSyncServer(client, true);

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
        "client -> LOAD Group sessions: header/3",
        "server -> KNOWN Group sessions: header/3",
        "client -> LOAD Map sessions: header/1",
        "client -> KNOWN Group sessions: header/3",
        "server -> KNOWN Map sessions: header/2",
        "server -> CONTENT Map header: false new: After: 1 New: 1",
        "client -> KNOWN Map sessions: header/1",
        "client -> KNOWN Map sessions: header/2",
      ]
    `);
  });

  test("updating a coValue on both sides while offline", async () => {
    const { node: client } = await createConnectedTestAgentNode();

    const group = jazzCloud.node.createGroup();
    group.addMember("everyone", "writer");

    const map = group.createMap({
      fromServer: "initial",
      fromClient: "initial",
    });

    const mapOnClient = await loadCoValueOrFail(client, map.id);

    client.syncManager.getPeers()[0]?.gracefulShutdown();

    map.set("fromServer", "updated", "trusting");
    mapOnClient.set("fromClient", "updated", "trusting");

    const { messages } = connectNodeToSyncServer(client, true);

    await map.core.waitForSync();
    await mapOnClient.core.waitForSync();

    expect(mapOnClient.get("fromServer")).toEqual("updated");
    expect(mapOnClient.get("fromClient")).toEqual("updated");
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
        "client -> LOAD Group sessions: header/5",
        "server -> KNOWN Group sessions: header/5",
        "client -> LOAD Map sessions: header/2",
        "client -> KNOWN Group sessions: header/5",
        "server -> KNOWN Map sessions: header/2",
        "server -> CONTENT Map header: false new: After: 1 New: 1",
        "client -> KNOWN Map sessions: header/2",
        "client -> KNOWN Map sessions: header/3",
        "client -> CONTENT Map header: false new: After: 0 New: 1",
        "server -> KNOWN Map sessions: header/3",
      ]
    `);
  });
});
