import { expect, test } from "vitest";
import {
    ControlledAgent,
    LocalNode,

    cojsonInternals,
} from "cojson";
import {WasmCrypto} from "cojson/src/crypto/WasmCrypto.js";
import { IDBStorage } from "./index.js";

const Crypto = await WasmCrypto.create();

test.skip("Should be able to initialize and load from empty DB", async () => {
    const agentSecret = Crypto.newRandomAgentSecret();

    const node = new LocalNode(
        new ControlledAgent(agentSecret, Crypto),
        cojsonInternals.newRandomSessionID(Crypto.getAgentID(agentSecret)),
        Crypto,
    );

    node.syncManager.addPeer(await IDBStorage.asPeer({ trace: true }));

    console.log("yay!");

    const _group = node.createGroup();

    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(node.syncManager.peers["storage"]).toBeDefined();
});

test("Should be able to sync data to database and then load that from a new node", async () => {
    const agentSecret = Crypto.newRandomAgentSecret();

    const node1 = new LocalNode(
        new ControlledAgent(agentSecret, Crypto),
        cojsonInternals.newRandomSessionID(Crypto.getAgentID(agentSecret)),
        Crypto,
    );

    node1.syncManager.addPeer(
        await IDBStorage.asPeer({ trace: true, localNodeName: "node1" }),
    );

    console.log("yay!");

    const group = node1.createGroup();

    const map = group.createMap();

    map.set("hello", "world");

    await new Promise((resolve) => setTimeout(resolve, 200));

    const node2 = new LocalNode(
        new ControlledAgent(agentSecret, Crypto),
        cojsonInternals.newRandomSessionID(Crypto.getAgentID(agentSecret)),
        Crypto,
    );

    node2.syncManager.addPeer(
        await IDBStorage.asPeer({ trace: true, localNodeName: "node2" }),
    );

    const map2 = await node2.load(map.id);
    if (map2 === "unavailable") {
        throw new Error("Map is unavailable");
    }

    expect(map2.get("hello")).toBe("world");
});
