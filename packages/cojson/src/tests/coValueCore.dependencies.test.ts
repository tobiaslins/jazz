import { beforeEach, expect, test } from "vitest";
import {
  loadCoValueOrFail,
  setupTestAccount,
  setupTestNode,
} from "./testUtils.js";

beforeEach(() => {
  setupTestNode({ isSyncServer: true });
});

test("should track the group dependency when creating a new coValue", () => {
  const client = setupTestNode();

  const group = client.node.createGroup();
  const map = group.createMap();

  expect(map.core.getDependedOnCoValues()).toEqual(new Set([group.core.id]));
});

test("should track the source dependency when creating a new branch", () => {
  const client = setupTestNode();

  const group = client.node.createGroup();
  const map = group.createMap();

  const branch = map.core.createBranch("feature-branch", group.id);

  expect(branch.getDependedOnCoValues()).toEqual(
    new Set([map.core.id, group.core.id]),
  );
});

test("should track the parent group dependency when extending a group", () => {
  const client = setupTestNode();

  const group = client.node.createGroup();
  const parentGroup = client.node.createGroup();

  group.extend(parentGroup);

  expect(group.core.getDependedOnCoValues()).toEqual(
    new Set([parentGroup.core.id]),
  );
});

test("should track the account dependency when syncing an account session", async () => {
  const sourceClient = await setupTestAccount({
    connected: true,
  });
  const targetClient = await setupTestAccount({
    connected: true,
  });

  const group = sourceClient.node.createGroup();
  group.addMember("everyone", "reader");
  const map = group.createMap();

  map.set("hello", "world");

  await map.core.waitForSync();

  const loadedMap = await loadCoValueOrFail(targetClient.node, map.id);

  expect(loadedMap.core.getDependedOnCoValues()).toEqual(
    new Set([group.core.id, sourceClient.accountID]),
  );
});

test("should track the account dependency when syncing a group extension", async () => {
  const sourceClient = await setupTestAccount({
    connected: true,
  });
  const targetClient = await setupTestAccount({
    connected: true,
  });

  const group = sourceClient.node.createGroup();
  const parentGroup = sourceClient.node.createGroup();

  group.extend(parentGroup);

  await group.core.waitForSync();

  const loadedGroup = await loadCoValueOrFail(targetClient.node, group.id);

  expect(loadedGroup.core.getDependedOnCoValues()).toEqual(
    new Set([parentGroup.core.id, sourceClient.accountID]),
  );
});
