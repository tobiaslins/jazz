import { AccountRole } from "cojson";
import { WasmCrypto } from "cojson/crypto/WasmCrypto";
import { beforeEach, describe, expect, test } from "vitest";
import { Account, CoMap, Group, Profile, co } from "../exports.js";
import { createJazzTestAccount } from "../testing.js";
import { setupTwoNodes } from "./utils.js";

const Crypto = await WasmCrypto.create();

beforeEach(async () => {
  await createJazzTestAccount({
    isCurrentActiveAccount: true,
  });
});

describe("Custom accounts and groups", async () => {
  test("Custom account and group", async () => {
    class CustomProfile extends Profile {
      name = co.string;
      color = co.string;
    }

    class CustomAccount extends Account {
      profile = co.ref(CustomProfile);
      root = co.ref(CoMap);

      migrate(this: CustomAccount, creationProps?: { name: string }) {
        if (creationProps) {
          const profileGroup = Group.create({ owner: this });
          profileGroup.addMember("everyone", "reader");
          this.profile = CustomProfile.create(
            { name: creationProps.name, color: "blue" },
            profileGroup,
          );
        }
      }
    }

    class CustomGroup extends Group {
      profile = co.null;
      root = co.null;
      [co.members] = co.ref(CustomAccount);

      get nMembers() {
        return this.members.length;
      }
    }
    const me = await CustomAccount.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    expect(me.profile).toBeDefined();
    expect(me.profile?.name).toBe("Hermes Puggington");
    expect(me.profile?.color).toBe("blue");

    const group = CustomGroup.create({ owner: me });
    group.addMember("everyone", "reader");

    expect(group.members).toMatchObject([
      { id: me.id, role: "admin" },
      { id: "everyone", role: "reader" },
    ]);

    expect(group.nMembers).toBe(2);

    await new Promise<void>((resolve) => {
      group.subscribe({}, (update) => {
        const meAsMember = update.members.find((member) => {
          return member.id === me.id && member.account?.profile;
        });
        if (meAsMember) {
          expect(meAsMember.account?.profile?.name).toBe("Hermes Puggington");
          expect(meAsMember.account?.profile?.color).toBe("blue");
          resolve();
        }
      });
    });

    class MyMap extends CoMap {
      name = co.string;
    }

    const map = MyMap.create({ name: "test" }, { owner: group });

    const meAsCastMember = map._owner
      .castAs(CustomGroup)
      .members.find((member) => member.id === me.id);
    expect(meAsCastMember?.account?.profile?.name).toBe("Hermes Puggington");
    expect(meAsCastMember?.account?.profile?.color).toBe("blue");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((map._owner as any).nMembers).toBeUndefined();
    expect(map._owner.castAs(CustomGroup).nMembers).toBe(2);
  });

  test("Should throw when creating a profile with an account as owner", async () => {
    class CustomAccount extends Account {
      migrate(this: CustomAccount, creationProps?: { name: string }) {
        if (creationProps) {
          this.profile = Profile.create(
            { name: creationProps.name },
            // @ts-expect-error - only groups can own profiles, but we want to also perform a runtime check
            this,
          );
        }
      }
    }

    expect(() =>
      CustomAccount.create({
        creationProps: { name: "Hermes Puggington" },
        crypto: Crypto,
      }),
    ).rejects.toThrowError("Profiles should be owned by a group");
  });

  test("Should enforce 'name' to be set to the creationProps.name if it exists", async () => {
    class CustomAccount extends Account {
      migrate(this: CustomAccount, creationProps?: { name: string }) {
        if (creationProps) {
          const profileGroup = Group.create({ owner: this });

          this.profile = Profile.create(
            { name: "Stephen Hawking" },
            profileGroup,
          );
        }
      }
    }

    const me = await CustomAccount.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    expect(me.profile?.name).toBe("Hermes Puggington");
  });
});

describe("Group inheritance", () => {
  class TestMap extends CoMap {
    title = co.string;
  }

  test("Group inheritance", async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const parentGroup = Group.create({ owner: me });
    const group = Group.create({ owner: me });

    group.extend(parentGroup);

    const reader = await Account.createAs(me, {
      creationProps: { name: "Reader" },
    });

    parentGroup.addMember(reader, "reader");

    const mapInChild = TestMap.create({ title: "In Child" }, { owner: group });

    const mapAsReader = await TestMap.load(mapInChild.id, reader, {});
    expect(mapAsReader?.title).toBe("In Child");

    await parentGroup.removeMember(reader);

    mapInChild.title = "In Child (updated)";

    const mapAsReaderAfterUpdate = await TestMap.load(
      mapInChild.id,
      reader,
      {},
    );
    expect(mapAsReaderAfterUpdate?.title).toBe("In Child");
  });

  test("Group inheritance with grand-children", async () => {
    const me = await Account.create({
      creationProps: { name: "Hermes Puggington" },
      crypto: Crypto,
    });

    const grandParentGroup = Group.create({ owner: me });
    const parentGroup = Group.create({ owner: me });
    const group = Group.create({ owner: me });

    group.extend(parentGroup);
    parentGroup.extend(grandParentGroup);

    const reader = await Account.createAs(me, {
      creationProps: { name: "Reader" },
    });

    grandParentGroup.addMember(reader, "reader");

    const mapInGrandChild = TestMap.create(
      { title: "In Grand Child" },
      { owner: group },
    );

    const mapAsReader = await TestMap.load(mapInGrandChild.id, reader, {});
    expect(mapAsReader?.title).toBe("In Grand Child");

    await grandParentGroup.removeMember(reader);

    mapInGrandChild.title = "In Grand Child (updated)";

    const mapAsReaderAfterUpdate = await TestMap.load(
      mapInGrandChild.id,
      reader,
      {},
    );
    expect(mapAsReaderAfterUpdate?.title).toBe("In Grand Child");
  });

  test("waitForSync should resolve when the value is uploaded", async () => {
    const { clientNode, serverNode, clientAccount } = await setupTwoNodes();

    const group = Group.create({ owner: clientAccount });

    await group.waitForSync({ timeout: 1000 });

    // Killing the client node so the serverNode can't load the map from it
    clientNode.gracefulShutdown();

    const loadedGroup = await serverNode.load(group._raw.id);

    expect(loadedGroup).not.toBe("unavailable");
  });

  test("everyone is valid only for reader and writer roles", () => {
    const group = Group.create();
    group.addMember("everyone", "reader");

    expect(group.members).toContainEqual({
      id: "everyone",
      role: "reader",
      account: undefined,
      ref: undefined,
    });

    group.addMember("everyone", "writer");

    expect(group.members).toContainEqual({
      id: "everyone",
      role: "writer",
      account: undefined,
      ref: undefined,
    });

    // @ts-expect-error - admin is not a valid role for everyone
    expect(() => group.addMember("everyone", "admin")).toThrow();

    expect(group.members).toContainEqual({
      id: "everyone",
      role: "writer",
      account: undefined,
      ref: undefined,
    });

    // @ts-expect-error - writeOnly is not a valid role for everyone
    expect(() => group.addMember("everyone", "writeOnly")).toThrow();

    expect(group.members).toContainEqual({
      id: "everyone",
      role: "writer",
      account: undefined,
      ref: undefined,
    });
  });

  test("typescript should show an error when adding a member with a non-account role", async () => {
    const account = await createJazzTestAccount({});

    const group = Group.create();

    // @ts-expect-error - Even though readerInvite is a valid role for an account, we don't allow it to not create confusion when using the intellisense
    group.addMember(account, "readerInvite");

    expect(group.members).toContainEqual(
      expect.objectContaining({
        id: account.id,
        role: "readerInvite",
      }),
    );
  });
});

// ... existing code ...

describe("Group.getRoleOf", () => {
  beforeEach(async () => {
    await createJazzTestAccount({ isCurrentActiveAccount: true });
  });

  test("returns correct role for admin", async () => {
    const group = Group.create();
    const admin = await createJazzTestAccount({});
    group.addMember(admin, "admin");
    expect(group.getRoleOf(admin.id)).toBe("admin");
    expect(group.getRoleOf("me")).toBe("admin");
  });

  test("returns correct role for writer", async () => {
    const group = Group.create();
    const writer = await createJazzTestAccount({});
    group.addMember(writer, "writer");
    expect(group.getRoleOf(writer.id)).toBe("writer");
  });

  test("returns correct role for reader", async () => {
    const group = Group.create();
    const reader = await createJazzTestAccount({});
    group.addMember(reader, "reader");
    expect(group.getRoleOf(reader.id)).toBe("reader");
  });

  test("returns correct role for writeOnly", async () => {
    const group = Group.create();
    const writeOnly = await createJazzTestAccount({});
    group.addMember(writeOnly, "writeOnly");
    expect(group.getRoleOf(writeOnly.id)).toBe("writeOnly");
  });

  test("returns correct role for everyone", () => {
    const group = Group.create();
    group.addMember("everyone", "reader");
    expect(group.getRoleOf("everyone")).toBe("reader");
  });
});

describe("Group.hasPermissions", () => {
  beforeEach(async () => {
    await createJazzTestAccount({ isCurrentActiveAccount: true });
  });

  test("admin has all permissions", async () => {
    const group = Group.create();
    const admin = await createJazzTestAccount({});
    group.addMember(admin, "admin");
    const roles: AccountRole[] = ["admin", "writer", "reader", "writeOnly"];

    roles.forEach((role) => {
      expect(group.hasPermissions(admin.id, role)).toBe(true);
      expect(group.hasPermissions("me", role)).toBe(true);
    });
  });

  test("writer has correct permission subset", async () => {
    const group = Group.create();
    const writer = await createJazzTestAccount({});
    group.addMember(writer, "writer");

    expect(group.hasPermissions(writer.id, "admin")).toBe(false);
    expect(group.hasPermissions(writer.id, "writer")).toBe(true);
    expect(group.hasPermissions(writer.id, "writeOnly")).toBe(true);
    expect(group.hasPermissions(writer.id, "reader")).toBe(true);
  });

  test("reader has only reader permissions", async () => {
    const group = Group.create();
    const reader = await createJazzTestAccount({});
    group.addMember(reader, "reader");

    expect(group.hasPermissions(reader.id, "admin")).toBe(false);
    expect(group.hasPermissions(reader.id, "writer")).toBe(false);
    expect(group.hasPermissions(reader.id, "writeOnly")).toBe(false);
    expect(group.hasPermissions(reader.id, "reader")).toBe(true);
  });

  test("writeOnly has only writeOnly permissions", async () => {
    const group = Group.create();
    const writeOnly = await createJazzTestAccount({});
    group.addMember(writeOnly, "writeOnly");

    expect(group.hasPermissions(writeOnly.id, "admin")).toBe(false);
    expect(group.hasPermissions(writeOnly.id, "writer")).toBe(false);
    expect(group.hasPermissions(writeOnly.id, "writeOnly")).toBe(true);
    expect(group.hasPermissions(writeOnly.id, "reader")).toBe(false);
  });

  test("everyone role has correct permissions", () => {
    const group = Group.create();
    group.addMember("everyone", "reader");

    expect(group.hasPermissions("everyone", "admin")).toBe(false);
    expect(group.hasPermissions("everyone", "writer")).toBe(false);
    expect(group.hasPermissions("everyone", "writeOnly")).toBe(false);
    expect(group.hasPermissions("everyone", "reader")).toBe(true);
  });

  test("non-member has no permissions", async () => {
    const group = Group.create();
    const nonMember = await createJazzTestAccount({});
    const roles: AccountRole[] = ["admin", "writer", "reader", "writeOnly"];

    roles.forEach((role) => {
      expect(group.hasPermissions(nonMember.id, role)).toBe(false);
    });
  });
});

describe("Group.getRoleOf with 'me' parameter", () => {
  beforeEach(async () => {
    await createJazzTestAccount({ isCurrentActiveAccount: true });
  });

  test("returns correct role for 'me' when current account is admin", () => {
    const group = Group.create();
    expect(group.getRoleOf("me")).toBe("admin");
  });

  test("returns correct role for 'me' when current account is writer", async () => {
    const account = await createJazzTestAccount();
    const group = Group.create({ owner: account });

    group.addMember(Account.getMe(), "writer");

    expect(group.getRoleOf("me")).toBe("writer");
  });

  test("returns correct role for 'me' when current account is reader", async () => {
    const account = await createJazzTestAccount();
    const group = Group.create({ owner: account });

    group.addMember(Account.getMe(), "reader");

    expect(group.getRoleOf("me")).toBe("reader");
  });

  test("returns undefined for 'me' when current account has no role", async () => {
    const account = await createJazzTestAccount();
    const group = Group.create({ owner: account });

    expect(group.getRoleOf("me")).toBeUndefined();
  });
});

describe("Group.hasPermissions with 'me' parameter", () => {
  beforeEach(async () => {
    await createJazzTestAccount({ isCurrentActiveAccount: true });
  });

  test("'me' has all permissions when admin", () => {
    const group = Group.create();
    const roles: AccountRole[] = ["admin", "writer", "reader", "writeOnly"];

    roles.forEach((role) => {
      expect(group.hasPermissions("me", role)).toBe(true);
    });
  });

  test("'me' has correct permission subset when writer", async () => {
    const account = await createJazzTestAccount();
    const group = Group.create({ owner: account });

    group.addMember(Account.getMe(), "writer");

    expect(group.hasPermissions("me", "admin")).toBe(false);
    expect(group.hasPermissions("me", "writer")).toBe(true);
    expect(group.hasPermissions("me", "writeOnly")).toBe(true);
    expect(group.hasPermissions("me", "reader")).toBe(true);
  });

  test("'me' has only reader permissions when reader", async () => {
    const account = await createJazzTestAccount();
    const group = Group.create({ owner: account });

    group.addMember(Account.getMe(), "reader");

    expect(group.hasPermissions("me", "admin")).toBe(false);
    expect(group.hasPermissions("me", "writer")).toBe(false);
    expect(group.hasPermissions("me", "writeOnly")).toBe(false);
    expect(group.hasPermissions("me", "reader")).toBe(true);
  });

  test("'me' has no permissions when not a member", async () => {
    const account = await createJazzTestAccount();
    const group = Group.create({ owner: account });

    const roles: AccountRole[] = ["admin", "writer", "reader", "writeOnly"];
    roles.forEach((role) => {
      expect(group.hasPermissions("me", role)).toBe(false);
    });
  });
});

describe("Account permissions", () => {
  beforeEach(async () => {
    await createJazzTestAccount({ isCurrentActiveAccount: true });
  });

  test("getRoleOf returns admin only for self and me", async () => {
    const account = await Account.create({
      creationProps: { name: "Test Account" },
      crypto: Crypto,
    });

    // Account should be admin of itself
    expect(account.getRoleOf(account.id)).toBe("admin");

    // The GlobalMe is not this account
    expect(account.getRoleOf("me")).toBe(undefined);
    expect(Account.getMe().getRoleOf("me")).toBe("admin");

    // Other accounts should have no role
    const otherAccount = await Account.create({
      creationProps: { name: "Other Account" },
      crypto: Crypto,
    });
    expect(account.getRoleOf(otherAccount.id)).toBeUndefined();

    // Everyone should have no role
    expect(account.getRoleOf("everyone")).toBeUndefined();
  });

  test("hasPermissions only allows admin permissions for self", async () => {
    const account = await Account.create({
      creationProps: { name: "Test Account" },
      crypto: Crypto,
    });

    // Account should have admin permissions for itself
    expect(account.hasPermissions(account.id, "admin")).toBe(true);
    expect(account.hasPermissions(account.id, "writer")).toBe(true);
    expect(account.hasPermissions(account.id, "reader")).toBe(true);
    expect(account.hasPermissions(account.id, "writeOnly")).toBe(true);

    // Current account should have admin permissions via "me" if it's the same account
    expect(account.hasPermissions("me", "admin")).toBe(account.isMe);

    // Other accounts should have no permissions
    const otherAccount = await Account.create({
      creationProps: { name: "Other Account" },
      crypto: Crypto,
    });
    expect(account.hasPermissions(otherAccount.id, "admin")).toBe(false);
    expect(account.hasPermissions(otherAccount.id, "writer")).toBe(false);
    expect(account.hasPermissions(otherAccount.id, "reader")).toBe(false);
    expect(account.hasPermissions(otherAccount.id, "writeOnly")).toBe(false);

    // Everyone should have no permissions
    expect(account.hasPermissions("everyone", "admin")).toBe(false);
    expect(account.hasPermissions("everyone", "writer")).toBe(false);
    expect(account.hasPermissions("everyone", "reader")).toBe(false);
    expect(account.hasPermissions("everyone", "writeOnly")).toBe(false);
  });

  test("members array only contains self as admin", async () => {
    const account = await Account.create({
      creationProps: { name: "Test Account" },
      crypto: Crypto,
    });

    expect(account.members).toEqual([
      { id: account.id, role: "admin", account: account },
    ]);
  });
});
