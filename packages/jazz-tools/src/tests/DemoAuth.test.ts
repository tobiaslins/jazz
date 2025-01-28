import { AgentSecret } from "cojson";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AuthSecretStorage } from "../auth/AuthSecretStorage";
import { DemoAuth } from "../auth/DemoAuth";
import { InMemoryKVStore } from "../auth/InMemoryKVStore";
import { KvStoreContext } from "../auth/KvStoreContext";
import { Account } from "../coValues/account";
import { ID } from "../internal";
import { createJazzTestAccount } from "../testing";

// Initialize KV store for tests
const kvStore = new InMemoryKVStore();
KvStoreContext.getInstance().initialize(kvStore);

describe("DemoAuth", () => {
  let mockAuthenticate: any;
  let authSecretStorage: AuthSecretStorage;
  let demoAuth: DemoAuth;

  beforeEach(async () => {
    // Reset mock authenticate
    mockAuthenticate = vi.fn();

    // Clear KV store
    kvStore.clearAll();

    // Create new AuthSecretStorage instance
    authSecretStorage = new AuthSecretStorage();

    await createJazzTestAccount({
      isCurrentActiveAccount: true,
    });

    // Create DemoAuth instance
    demoAuth = new DemoAuth(mockAuthenticate, authSecretStorage);
  });

  describe("logIn", () => {
    test("should successfully log in existing user", async () => {
      const testUser = "testUser";
      const storageData = {
        accountID: "test-account-id" as ID<Account>,
        accountSecret: "test-secret" as AgentSecret,
        secretSeed: [1, 2, 3],
      };

      // Store test user data
      await kvStore.set(
        "demo-auth-existing-users-" + testUser,
        JSON.stringify(storageData),
      );

      await demoAuth.logIn(testUser);

      expect(mockAuthenticate).toHaveBeenCalledWith({
        accountID: storageData.accountID,
        accountSecret: storageData.accountSecret,
      });

      const storedData = await authSecretStorage.get();
      expect(storedData).toEqual({
        accountID: storageData.accountID,
        accountSecret: storageData.accountSecret,
        secretSeed: new Uint8Array(storageData.secretSeed),
        provider: "demo",
      });
    });

    test("should throw error for non-existent user", async () => {
      await expect(demoAuth.logIn("nonexistentUser")).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("signUp", () => {
    test("should successfully sign up new user", async () => {
      const testUser = "newUser";
      const credentials = {
        accountID: "new-account-id" as ID<Account>,
        accountSecret: "new-secret" as AgentSecret,
        secretSeed: new Uint8Array([1, 2, 3]),
      };

      await authSecretStorage.set({
        ...credentials,
        provider: "anonymous",
      });

      await demoAuth.signUp(testUser);

      const storedData = await authSecretStorage.get();
      expect(storedData).toEqual({
        ...credentials,
        provider: "demo",
      });

      const storedUserData = await kvStore.get(
        "demo-auth-existing-users-" + testUser,
      );
      expect(JSON.parse(storedUserData!)).toEqual({
        accountID: credentials.accountID,
        accountSecret: credentials.accountSecret,
        secretSeed: Array.from(credentials.secretSeed),
      });
    });

    test("should throw error for existing username", async () => {
      const testUser = "existingUser";
      await kvStore.set("demo-auth-existing-users", testUser);

      await expect(demoAuth.signUp(testUser)).rejects.toThrow(
        "User already registered",
      );
    });

    test("should throw error when no credentials found", async () => {
      await expect(demoAuth.signUp("newUser")).rejects.toThrow(
        "No credentials found",
      );
    });
  });

  describe("getExistingUsers", () => {
    test("should return list of existing users", async () => {
      const existingUsers = "user1,user2,user3";
      await kvStore.set("demo-auth-existing-users", existingUsers);

      const users = await demoAuth.getExistingUsers();
      expect(users).toEqual(["user1", "user2", "user3"]);
    });

    test("should return empty array when no users exist", async () => {
      const users = await demoAuth.getExistingUsers();
      expect(users).toEqual([]);
    });
  });
});
