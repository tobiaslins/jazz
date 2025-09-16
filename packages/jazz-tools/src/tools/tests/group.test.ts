import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";
import { Account, co, Group, Loaded, Ref } from "../internal";
import { createJazzTestAccount, setupJazzTestSync } from "../testing";

beforeEach(async () => {
  await setupJazzTestSync();

  await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });
});

describe("Group", () => {
  it("should create a group", () => {
    const group = co.group().create();
    expect(group).toBeDefined();

    // Group methods are available , testing only for a few ones
    expect(group.addMember).toBeDefined();
    expect(group.removeMember).toBeDefined();
    expect(group.getRoleOf).toBeDefined();
    expect(group.makePublic).toBeDefined();
  });

  it("should make a group public", () => {
    const group = co.group().create();
    expect(group.getRoleOf("everyone")).toBeUndefined();

    group.makePublic();
    expect(group.getRoleOf("everyone")).toBe("reader");
  });

  describe("TypeScript", () => {
    it("should correctly type the resolve query", async () => {
      const group = co.group().create();
      co.group().load(group.$jazz.id, {
        resolve: {},
      });
      co.group().load(group.$jazz.id, {
        resolve: true,
      });

      await expect(
        co.group().load(group.$jazz.id, {
          resolve: {
            // @ts-expect-error - members is not a valid resolve query
            members: {
              $each: true,
            },
          },
        }),
      ).rejects.toThrow();
    });

    it("should correctly type the create function", () => {
      const g = co.group();

      expectTypeOf(g.create).toBeCallableWith({ owner: Account.getMe() });
      expectTypeOf(g.create).toBeCallableWith(Account.getMe());
      expectTypeOf(g.create).toBeCallableWith(undefined);
    });
  });
});
