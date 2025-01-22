import { beforeEach, describe, expect, test } from "vitest";
import { CoMap, Group } from "../exports";
import { createJazzTestAccount, setupJazzTestSync } from "../testing";

describe("Jazz Test Sync", () => {
  beforeEach(async () => {
    await setupJazzTestSync();
  });

  test("two test accounts can sync through sync server", async () => {
    const account1 = await createJazzTestAccount();
    const account2 = await createJazzTestAccount();

    // Create a test group in account1
    const group = Group.create(account1);
    group.addMember("everyone", "reader");

    const map = CoMap.create({}, group);
    map._raw.set("test", "value");

    // Verify account2 can see the group
    const loadedMap = await CoMap.load(map.id, account2, {});
    expect(loadedMap).toBeDefined();
    expect(loadedMap?._raw.get("test")).toBe("value");
  });
});
