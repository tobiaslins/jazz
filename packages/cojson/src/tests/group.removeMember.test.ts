import { beforeEach, describe, expect, test } from "vitest";
import { setCoValueLoadingRetryDelay } from "../config.js";
import {
  SyncMessagesLog,
  blockMessageTypeOnOutgoingPeer,
  loadCoValueOrFail,
  setupTestAccount,
  setupTestNode,
} from "./testUtils.js";

setCoValueLoadingRetryDelay(10);

let jazzCloud: ReturnType<typeof setupTestNode>;

beforeEach(async () => {
  SyncMessagesLog.clear();
  jazzCloud = setupTestNode({ isSyncServer: true });
});

describe("Group.removeMember", () => {
  test("revoking a member access should not affect everyone access", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const alice = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    group.addMember("everyone", "writer");

    const aliceOnAdminNode = await loadCoValueOrFail(
      admin.node,
      alice.accountID,
    );
    group.addMember(aliceOnAdminNode, "writer");
    group.removeMember(aliceOnAdminNode);

    const groupOnAliceNode = await loadCoValueOrFail(alice.node, group.id);
    expect(groupOnAliceNode.myRole()).toEqual("writer");

    const map = groupOnAliceNode.createMap();

    map.set("test", "test");
    expect(map.get("test")).toEqual("test");
  });

  test("revoking a member access should not affect everyone access when everyone access is gained through a group extension", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const alice = await setupTestAccount({
      connected: true,
    });

    const parentGroup = admin.node.createGroup();
    const group = admin.node.createGroup();
    parentGroup.addMember("everyone", "reader");
    group.extend(parentGroup);

    const aliceOnAdminNode = await loadCoValueOrFail(
      admin.node,
      alice.accountID,
    );
    group.addMember(aliceOnAdminNode, "writer");
    group.removeMember(aliceOnAdminNode);

    const map = group.createMap();
    map.set("test", "test");

    const groupOnAliceNode = await loadCoValueOrFail(alice.node, group.id);
    expect(groupOnAliceNode.myRole()).toEqual("reader");

    const mapOnAliceNode = await loadCoValueOrFail(alice.node, map.id);
    expect(mapOnAliceNode.get("test")).toEqual("test");
  });

  test("a reader member should be able to revoke themselves", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const reader = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    const readerOnAdminNode = await loadCoValueOrFail(
      admin.node,
      reader.accountID,
    );
    group.addMember(readerOnAdminNode, "reader");

    const groupOnReaderNode = await loadCoValueOrFail(reader.node, group.id);
    expect(groupOnReaderNode.myRole()).toEqual("reader");

    await groupOnReaderNode.removeMember(
      reader.node.expectCurrentAccount("reader"),
    );

    expect(groupOnReaderNode.myRole()).toEqual(undefined);
  });

  test("a writer member should be able to revoke themselves", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const writer = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    const writerOnAdminNode = await loadCoValueOrFail(
      admin.node,
      writer.accountID,
    );
    group.addMember(writerOnAdminNode, "writer");

    const groupOnWriterNode = await loadCoValueOrFail(writer.node, group.id);
    expect(groupOnWriterNode.myRole()).toEqual("writer");

    await groupOnWriterNode.removeMember(
      writer.node.expectCurrentAccount("writer"),
    );

    expect(groupOnWriterNode.myRole()).toEqual(undefined);
  });

  test("a writeOnly member should be able to revoke themselves", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const writeOnly = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    const writeOnlyOnAdminNode = await loadCoValueOrFail(
      admin.node,
      writeOnly.accountID,
    );
    group.addMember(writeOnlyOnAdminNode, "writeOnly");

    const groupOnWriteOnlyNode = await loadCoValueOrFail(
      writeOnly.node,
      group.id,
    );
    expect(groupOnWriteOnlyNode.myRole()).toEqual("writeOnly");

    await groupOnWriteOnlyNode.removeMember(
      writeOnly.node.expectCurrentAccount("writeOnly"),
    );

    expect(groupOnWriteOnlyNode.myRole()).toEqual(undefined);
  });

  test("an admin member should be able to revoke themselves", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const otherAdmin = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    const otherAdminOnAdminNode = await loadCoValueOrFail(
      admin.node,
      otherAdmin.accountID,
    );
    group.addMember(otherAdminOnAdminNode, "admin");

    const groupOnOtherAdminNode = await loadCoValueOrFail(
      otherAdmin.node,
      group.id,
    );
    expect(groupOnOtherAdminNode.myRole()).toEqual("admin");

    await groupOnOtherAdminNode.removeMember(
      otherAdmin.node.expectCurrentAccount("admin"),
    );

    expect(groupOnOtherAdminNode.myRole()).toEqual(undefined);
  });

  test("a writer member cannot remove other accounts", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const writer = await setupTestAccount({
      connected: true,
    });

    const otherMember = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    const writerOnAdminNode = await loadCoValueOrFail(
      admin.node,
      writer.accountID,
    );
    const otherMemberOnAdminNode = await loadCoValueOrFail(
      admin.node,
      otherMember.accountID,
    );

    group.addMember(writerOnAdminNode, "writer");
    group.addMember(otherMemberOnAdminNode, "reader");

    const groupOnWriterNode = await loadCoValueOrFail(writer.node, group.id);
    expect(groupOnWriterNode.myRole()).toEqual("writer");

    const otherMemberOnWriterNode = await loadCoValueOrFail(
      writer.node,
      otherMember.accountID,
    );

    await groupOnWriterNode.removeMember(otherMemberOnWriterNode);

    expect(groupOnWriterNode.roleOf(otherMember.accountID)).toEqual("reader");
  });

  test("a writeOnly member cannot remove other accounts", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const writeOnly = await setupTestAccount({
      connected: true,
    });

    const otherMember = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    const writeOnlyOnAdminNode = await loadCoValueOrFail(
      admin.node,
      writeOnly.accountID,
    );
    const otherMemberOnAdminNode = await loadCoValueOrFail(
      admin.node,
      otherMember.accountID,
    );

    group.addMember(writeOnlyOnAdminNode, "writeOnly");
    group.addMember(otherMemberOnAdminNode, "reader");

    const groupOnWriteOnlyNode = await loadCoValueOrFail(
      writeOnly.node,
      group.id,
    );
    expect(groupOnWriteOnlyNode.myRole()).toEqual("writeOnly");

    const otherMemberOnWriteOnlyNode = await loadCoValueOrFail(
      writeOnly.node,
      otherMember.accountID,
    );

    await groupOnWriteOnlyNode.removeMember(otherMemberOnWriteOnlyNode);

    expect(groupOnWriteOnlyNode.roleOf(otherMember.accountID)).toEqual(
      "reader",
    );
  });

  test("a reader member cannot remove other accounts", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const reader = await setupTestAccount({
      connected: true,
    });

    const otherMember = await setupTestAccount({
      connected: true,
    });

    const group = admin.node.createGroup();
    const readerOnAdminNode = await loadCoValueOrFail(
      admin.node,
      reader.accountID,
    );
    const otherMemberOnAdminNode = await loadCoValueOrFail(
      admin.node,
      otherMember.accountID,
    );

    group.addMember(readerOnAdminNode, "reader");
    group.addMember(otherMemberOnAdminNode, "writer");

    const groupOnReaderNode = await loadCoValueOrFail(reader.node, group.id);
    expect(groupOnReaderNode.myRole()).toEqual("reader");

    const otherMemberOnReaderNode = await loadCoValueOrFail(
      reader.node,
      otherMember.accountID,
    );

    await groupOnReaderNode.removeMember(otherMemberOnReaderNode);

    expect(groupOnReaderNode.roleOf(otherMember.accountID)).toEqual("writer");
  });

  test("removing a member when inheriting a group where the user lacks read rights", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const childAdmin = await setupTestAccount({
      connected: true,
    });

    const reader = await setupTestAccount({
      connected: true,
    });

    const childAdminOnAdminNode = await loadCoValueOrFail(
      admin.node,
      childAdmin.accountID,
    );

    const readerOnAdminNode = await loadCoValueOrFail(
      admin.node,
      reader.accountID,
    );

    const group = admin.node.createGroup();

    const childGroup = admin.node.createGroup();
    childGroup.addMember(childAdminOnAdminNode, "admin");
    childGroup.addMember(readerOnAdminNode, "reader");

    childGroup.extend(group);

    const readerOnChildAdminNode = await loadCoValueOrFail(
      childAdmin.node,
      reader.accountID,
    );

    const childGroupOnChildAdminNode = await loadCoValueOrFail(
      childAdmin.node,
      childGroup.id,
    );

    await childGroupOnChildAdminNode.removeMember(readerOnChildAdminNode);

    expect(childGroupOnChildAdminNode.roleOf(reader.accountID)).toEqual(
      undefined,
    );
  });

  test("removing a member should rotate the readKey on available child groups", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const alice = await setupTestAccount({
      connected: true,
    });

    const aliceOnAdminNode = await loadCoValueOrFail(
      admin.node,
      alice.accountID,
    );

    const group = admin.node.createGroup();
    const childGroup = admin.node.createGroup();
    group.addMember(aliceOnAdminNode, "reader");

    childGroup.extend(group);

    group.removeMember(aliceOnAdminNode);

    const map = childGroup.createMap();
    map.set("test", "Not readable by alice");

    await map.core.waitForSync();

    const mapOnAliceNode = await loadCoValueOrFail(alice.node, map.id);
    expect(mapOnAliceNode.get("test")).toBeUndefined();
  });

  test("removing a member should rotate the readKey on unloaded child groups", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const bob = await setupTestAccount({
      connected: true,
    });

    const alice = await setupTestAccount({
      connected: true,
    });

    const bobOnAdminNode = await loadCoValueOrFail(admin.node, bob.accountID);

    const aliceOnAdminNode = await loadCoValueOrFail(
      admin.node,
      alice.accountID,
    );

    const group = admin.node.createGroup();

    const childGroup = bob.node.createGroup();
    group.addMember(bobOnAdminNode, "reader");
    group.addMember(aliceOnAdminNode, "reader");

    const groupOnBobNode = await loadCoValueOrFail(bob.node, group.id);

    childGroup.extend(groupOnBobNode);

    await childGroup.core.waitForSync();

    group.removeMember(aliceOnAdminNode);

    // Rotating the child group keys is async when the child group is not loaded
    await admin.node.getCoValue(childGroup.id).waitForAvailableOrUnavailable();
    await admin.node.syncManager.waitForAllCoValuesSync();

    const map = childGroup.createMap();
    map.set("test", "Not readable by alice");

    await map.core.waitForSync();

    const mapOnAliceNode = await loadCoValueOrFail(alice.node, map.id);
    expect(mapOnAliceNode.get("test")).toBeUndefined();
  });

  test("removing a member should work even if there are partially available child groups", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const bob = await setupTestAccount();
    const { peer } = bob.connectToSyncServer();

    const alice = await setupTestAccount({
      connected: true,
    });

    const bobOnAdminNode = await loadCoValueOrFail(admin.node, bob.accountID);

    const aliceOnAdminNode = await loadCoValueOrFail(
      admin.node,
      alice.accountID,
    );

    const group = admin.node.createGroup();
    const childGroup = bob.node.createGroup();

    group.addMember(bobOnAdminNode, "reader");
    group.addMember(aliceOnAdminNode, "reader");

    await group.core.waitForSync();

    blockMessageTypeOnOutgoingPeer(peer, "content", {
      id: childGroup.id,
    });

    const groupOnBobNode = await loadCoValueOrFail(bob.node, group.id);

    childGroup.extend(groupOnBobNode);

    await groupOnBobNode.core.waitForSync();

    group.removeMember(aliceOnAdminNode);

    await admin.node.syncManager.waitForAllCoValuesSync();

    const map = group.createMap();
    map.set("test", "Not readable by alice");

    await map.core.waitForSync();

    const mapOnAliceNode = await loadCoValueOrFail(alice.node, map.id);
    expect(mapOnAliceNode.get("test")).toBeUndefined();
  });

  test("removing a member should work even if there are unavailable child groups", async () => {
    const admin = await setupTestAccount({
      connected: true,
    });

    const { peerOnServer } = admin.connectToSyncServer();

    const bob = await setupTestAccount({
      connected: true,
    });

    const alice = await setupTestAccount({
      connected: true,
    });

    const bobOnAdminNode = await loadCoValueOrFail(admin.node, bob.accountID);

    const aliceOnAdminNode = await loadCoValueOrFail(
      admin.node,
      alice.accountID,
    );

    const group = admin.node.createGroup();
    const childGroup = bob.node.createGroup();

    blockMessageTypeOnOutgoingPeer(peerOnServer, "content", {
      id: childGroup.id,
    });

    group.addMember(bobOnAdminNode, "reader");
    group.addMember(aliceOnAdminNode, "reader");

    await group.core.waitForSync();

    const groupOnBobNode = await loadCoValueOrFail(bob.node, group.id);

    childGroup.extend(groupOnBobNode);

    await groupOnBobNode.core.waitForSync();

    group.removeMember(aliceOnAdminNode);

    await group.core.waitForSync();

    const map = group.createMap();
    map.set("test", "Not readable by alice");

    await map.core.waitForSync();

    const mapOnAliceNode = await loadCoValueOrFail(alice.node, map.id);
    expect(mapOnAliceNode.get("test")).toBeUndefined();
  });
});
