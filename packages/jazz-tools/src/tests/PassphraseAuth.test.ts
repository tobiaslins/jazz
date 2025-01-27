// @vitest-environment happy-dom

import { mnemonicToEntropy } from "@scure/bip39";
import { AgentSecret } from "cojson";
import {
  Account,
  AuthSecretStorage,
  InMemoryKVStore,
  KvStoreContext,
} from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PassphraseAuth } from "../auth/PassphraseAuth";
import { createJazzTestAccount } from "../testing";
import { TestJSCrypto } from "../testing";
import { testWordlist } from "./fixtures";

// Initialize KV store for tests
KvStoreContext.getInstance().initialize(new InMemoryKVStore());

describe("PassphraseAuth", () => {
  let crypto: TestJSCrypto;
  let mockAuthenticate: any;
  let mockRegister: any;
  let authSecretStorage: AuthSecretStorage;
  let passphraseAuth: PassphraseAuth;

  beforeEach(async () => {
    // Reset storage
    KvStoreContext.getInstance().getStorage().clearAll();

    // Set up crypto and mocks
    crypto = await TestJSCrypto.create();
    mockAuthenticate = vi.fn();
    mockRegister = vi.fn().mockImplementation(async (secret) => {
      const accountID = crypto.getAgentID(secret);
      return accountID;
    });
    authSecretStorage = new AuthSecretStorage();

    await createJazzTestAccount({
      isCurrentActiveAccount: true,
    });

    // Create PassphraseAuth instance
    passphraseAuth = new PassphraseAuth(
      crypto,
      mockAuthenticate,
      mockRegister,
      authSecretStorage,
      testWordlist,
    );
  });

  describe("logIn", () => {
    it("should successfully log in with valid passphrase", async () => {
      // Generate a valid passphrase
      const passphrase = passphraseAuth.generateRandomPassphrase();

      await passphraseAuth.logIn(passphrase);

      expect(mockAuthenticate).toHaveBeenCalledWith({
        accountID: expect.any(String),
        accountSecret: expect.any(String),
      });

      const storedData = await authSecretStorage.get();
      expect(storedData).toEqual({
        accountID: expect.any(String),
        accountSecret: expect.any(String),
        secretSeed: expect.any(Uint8Array),
        provider: "passphrase",
      });
    });

    it("should throw error with invalid passphrase", async () => {
      await expect(passphraseAuth.logIn("invalid words here")).rejects.toThrow(
        "Invalid passphrase",
      );
    });
  });

  describe("signUp", () => {
    it("should successfully sign up new user", async () => {
      const username = "testUser";
      const passphrase = passphraseAuth.generateRandomPassphrase();

      await passphraseAuth.signUp(username, passphrase);

      expect(mockRegister).toHaveBeenCalledWith(expect.any(String), {
        name: username,
      });

      const storedData = await authSecretStorage.get();
      expect(storedData).toEqual({
        accountID: expect.any(String),
        accountSecret: expect.any(String),
        secretSeed: expect.any(Uint8Array),
        provider: "passphrase",
      });
    });

    it("should throw error with invalid passphrase during signup", async () => {
      await expect(
        passphraseAuth.signUp("testUser", "invalid words here"),
      ).rejects.toThrow("Invalid passphrase");
    });

    it("should update account name after successful signup", async () => {
      const username = "Arale!";
      const passphrase = passphraseAuth.generateRandomPassphrase();

      const account = await createJazzTestAccount({
        isCurrentActiveAccount: true,
      });

      await passphraseAuth.signUp(username, passphrase);

      expect(account.profile?.name).toBe(username);
    });
  });

  describe("getCurrentUserPassphrase", () => {
    it("should return current user passphrase when credentials exist", async () => {
      // First sign up to create valid credentials
      const username = "testUser";
      const originalPassphrase = passphraseAuth.generateRandomPassphrase();
      await passphraseAuth.signUp(username, originalPassphrase);

      // Then get the current passphrase
      const retrievedPassphrase =
        await passphraseAuth.getCurrentUserPassphrase();
      expect(retrievedPassphrase).toBe(originalPassphrase);
    });

    it("should throw error when no credentials found", async () => {
      await expect(passphraseAuth.getCurrentUserPassphrase()).rejects.toThrow(
        "No credentials found",
      );
    });
  });
});
