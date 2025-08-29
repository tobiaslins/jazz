import { beforeEach, describe, expect, test } from "vitest";
import {
  createTestNode,
  setupTestNode,
  loadCoValueOrFail,
} from "./testUtils.js";
import { expectMap } from "../coValue.js";

let jazzCloud: ReturnType<typeof setupTestNode>;

beforeEach(async () => {
  jazzCloud = setupTestNode({ isSyncServer: true });
});

describe("Branching Logic", () => {
  describe("Branch Operations with Transactions", () => {
    test("should maintain separate transaction histories", async () => {
      const node = createTestNode();
      const group = node.createGroup();
      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add transactions to original map
      originalMap.set("originalKey1", "value1", "trusting");
      originalMap.set("originalKey2", "value2", "trusting");

      const branch = expectMap(
        originalMap.core.createBranch(branchName, group.id).getCurrentContent(),
      );

      // Add transactions to branch
      branch.set("branchKey1", "branchValue1", "trusting");
      branch.set("branchKey2", "branchValue2", "trusting");

      expect(originalMap.get("branchKey1")).toBe(undefined);
      expect(originalMap.get("branchKey2")).toBe(undefined);
      expect(branch.get("branchKey2")).toBe("branchValue2");
      expect(branch.get("branchKey1")).toBe("branchValue1");
      expect(branch.get("originalKey1")).toBe("value1");
      expect(branch.get("originalKey2")).toBe("value2");
    });
  });

  describe("Branch Merging", () => {
    test("should merge branch transactions back to source", () => {
      const node = createTestNode();
      const group = node.createGroup();
      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add transactions to original map
      originalMap.set("key1", "value1", "trusting");
      originalMap.set("key2", "value2", "trusting");

      // Create branch
      const branch = expectMap(
        originalMap.core.createBranch(branchName, group.id).getCurrentContent(),
      );

      // Add transactions to branch
      branch.set("key1", "branchValue1", "trusting");

      // Merge branch
      const result = expectMap(branch.core.mergeBranch().getCurrentContent());

      // Check that source now has branch transactions
      expect(result.get("key1")).toBe("branchValue1");
      expect(result.get("key2")).toBe("value2");
    });

    test("should not merge branch transactions back to source if they are already merged", () => {
      const node = createTestNode();
      const group = node.createGroup();
      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add transactions to original map
      originalMap.set("key1", "value1", "trusting");
      originalMap.set("key2", "value2", "trusting");

      // Create branch
      const branch = expectMap(
        originalMap.core.createBranch(branchName, group.id).getCurrentContent(),
      );

      // Add transactions to branch
      branch.set("key1", "branchValue1", "trusting");

      // Merge branch twice
      expectMap(branch.core.mergeBranch().getCurrentContent());
      const result = expectMap(branch.core.mergeBranch().getCurrentContent());

      expect(result.core.mergeCommits.length).toBe(1);

      // Check that source now has branch transactions
      expect(result.get("key1")).toBe("branchValue1");
      expect(result.get("key2")).toBe("value2");
    });

    test("should not create a merge commit if the branch is empty", () => {
      const node = createTestNode();
      const group = node.createGroup();
      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add transactions to original map
      originalMap.set("key1", "value1", "trusting");
      originalMap.set("key2", "value2", "trusting");

      // Create branch
      const branch = expectMap(
        originalMap.core.createBranch(branchName, group.id).getCurrentContent(),
      );

      // Merge branch twice
      const result = expectMap(branch.core.mergeBranch().getCurrentContent());

      expect(result.core.mergeCommits.length).toBe(0);
    });

    test("should merge the new changes from the branch after the last merge", () => {
      const node = createTestNode();
      const group = node.createGroup();
      const originalMap = group.createMap();
      const branchName = "feature-branch";

      originalMap.set("key1", "value1", "trusting");
      originalMap.set("key2", "value2", "trusting");

      const branch = expectMap(
        originalMap.core.createBranch(branchName, group.id).getCurrentContent(),
      );

      branch.set("key1", "branchValue1", "trusting");

      branch.core.mergeBranch();

      expect(originalMap.get("key1")).toBe("branchValue1");
      expect(originalMap.get("key2")).toBe("value2");

      branch.set("key2", "branchValue2", "trusting");

      branch.core.mergeBranch();

      expect(originalMap.core.mergeCommits.length).toBe(2);

      expect(originalMap.get("key1")).toBe("branchValue1");
      expect(originalMap.get("key2")).toBe("branchValue2");
    });
  });

  describe("Branch loading", () => {
    test("should create a new branch if it doesn't exist when loading", async () => {
      const client = setupTestNode({
        connected: true,
      });
      const group = jazzCloud.node.createGroup();
      group.addMember("everyone", "writer");

      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add some data to the original map
      originalMap.set("key1", "value1");
      originalMap.set("key2", "value2");

      // Load the branch - it should create a new one since it doesn't exist
      const branch = await client.node.checkoutBranch(
        originalMap.id,
        branchName,
      );

      expect(branch).not.toBe("unavailable");

      if (branch !== "unavailable") {
        // The branch should inherit the original data
        expect(branch.get("key1")).toBe("value1");
        expect(branch.get("key2")).toBe("value2");

        // Add new data to the branch
        branch.set("branchKey", "branchValue");

        await branch.core.waitForSync();

        // The original map should not have the branch data
        expect(originalMap.get("branchKey")).toBe(undefined);
        expect(branch.get("branchKey")).toBe("branchValue");
      }
    });

    test("should load a branch if it exists", async () => {
      const client = setupTestNode({
        connected: true,
      });
      const group = jazzCloud.node.createGroup();
      group.addMember("everyone", "writer");

      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add some data to the original map
      originalMap.set("key1", "value1");
      originalMap.set("key2", "value2");

      const originalBranch = expectMap(
        originalMap.core.createBranch(branchName, group.id).getCurrentContent(),
      );

      originalBranch.set("branchKey", "branchValue");

      // Load the branch - it should return the already created branch
      const branch = await client.node.checkoutBranch(
        originalMap.id,
        branchName,
      );

      expect(branch).not.toBe("unavailable");

      if (branch !== "unavailable") {
        // The branch should inherit the original data
        expect(branch.get("key1")).toBe("value1");
        expect(branch.get("key2")).toBe("value2");
        expect(branch.get("branchKey")).toBe("branchValue");
      }
    });

    test("should successfully load a branch via node.load if the branch exists", async () => {
      const client = setupTestNode({
        connected: true,
      });
      const group = jazzCloud.node.createGroup();
      group.addMember("everyone", "writer");

      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add some data to the original map
      originalMap.set("key1", "value1");
      originalMap.set("key2", "value2");

      const originalBranch = expectMap(
        originalMap.core.createBranch(branchName, group.id).getCurrentContent(),
      );

      originalBranch.set("branchKey", "branchValue");

      // Load the branch - it should return the already created branch
      const branch = await client.node.load(originalBranch.id);

      expect(branch).not.toBe("unavailable");

      if (branch !== "unavailable") {
        expect(branch.get("key1")).toBe("value1");
        expect(branch.get("key2")).toBe("value2");
        expect(branch.get("branchKey")).toBe("branchValue");
      }
    });

    test("should create a branch with a different group when passing the group as ownerId", async () => {
      const client = setupTestNode({
        connected: true,
      });
      const group = jazzCloud.node.createGroup();
      group.addMember("everyone", "writer");

      const originalMap = group.createMap();
      const branchName = "feature-branch";

      // Add some data to the original map
      originalMap.set("key1", "value1");
      originalMap.set("key2", "value2");

      // Create a different group to own the branch
      const branchGroup = client.node.createGroup();

      // Load the branch with a different group as owner
      const branch = await client.node.checkoutBranch(
        originalMap.id,
        branchName,
        branchGroup.id,
      );

      expect(branch).not.toBe("unavailable");

      if (branch !== "unavailable") {
        // The branch should inherit the original data
        expect(branch.get("key1")).toBe("value1");
        expect(branch.get("key2")).toBe("value2");

        // Add new data to the branch
        branch.set("branchKey", "branchValue");

        await branch.core.waitForSync();

        // The original map should not have the branch data
        expect(originalMap.get("branchKey")).toBe(undefined);
        expect(branch.get("branchKey")).toBe("branchValue");
      }

      const branchOnTheServer = await jazzCloud.node.checkoutBranch(
        originalMap.id,
        branchName,
        branchGroup.id,
      );

      expect(branchOnTheServer).not.toBe("unavailable");

      if (branchOnTheServer !== "unavailable") {
        expect(branchOnTheServer.get("branchKey")).toBe(undefined);
        expect(branchOnTheServer.get("key1")).toBe(undefined);
        expect(branchOnTheServer.get("key2")).toBe(undefined);
      }
    });

    test("should return unavailable if the user tries to checkout a branch from a group", async () => {
      const client = setupTestNode({
        connected: true,
      });
      const group = jazzCloud.node.createGroup();
      group.addMember("everyone", "writer");

      // Try to load a branch from a group (not a map/list/stream)
      const branch = await client.node.checkoutBranch(
        group.id,
        "feature-branch",
      );

      // Should return unavailable since groups don't support branching
      expect(branch).toBe("unavailable");
    });

    test("should return unavailable if the source value doesn't exist", async () => {
      const client = setupTestNode();
      const group = jazzCloud.node.createGroup();
      group.addMember("everyone", "writer");

      // Create a map but don't create any branches
      const originalMap = group.createMap();
      originalMap.set("key1", "value1");

      // Try to load a branch that doesn't exist
      const branch = await client.node.checkoutBranch(
        originalMap.id,
        "non-existent-branch",
      );

      // Should return unavailable since the branch doesn't exist
      expect(branch).toBe("unavailable");
    });
  });

  describe("Branch conflicts", () => {
    test("should successfully handle two branches created concurrently on different nodes", async () => {
      const bob = setupTestNode();
      const { peer: bobPeer } = bob.connectToSyncServer();
      const alice = setupTestNode({
        connected: true,
      });

      const client = setupTestNode();
      const group = jazzCloud.node.createGroup();
      group.addMember("everyone", "writer");

      // Create a map but don't create any branches
      const originalMap = group.createMap();

      const originalMapOnBob = await loadCoValueOrFail(
        bob.node,
        originalMap.id,
      );

      // Disconnect bob from the sync server
      bobPeer.outgoing.close();

      const aliceBranch = await alice.node.checkoutBranch(
        originalMap.id,
        "feature-branch",
      );
      const bobBranch = expectMap(
        originalMapOnBob.core
          .createBranch("feature-branch", group.id)
          .getCurrentContent(),
      );

      if (aliceBranch === "unavailable") {
        throw new Error("Alice branch is unavailable");
      }

      bobBranch.set("bob", true);
      aliceBranch.set("alice", true);

      // Reconnect bob to the sync server
      bob.connectToSyncServer();

      await bobBranch.core.waitForSync();
      await aliceBranch.core.waitForSync();

      expect(bobBranch.get("alice")).toBe(true);
      expect(aliceBranch.get("bob")).toBe(true);
    });
  });
});
