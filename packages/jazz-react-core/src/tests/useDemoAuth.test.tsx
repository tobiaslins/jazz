// @vitest-environment happy-dom

import {
  Account,
  AuthSecretStorage,
  InMemoryKVStore,
  KvStoreContext,
} from "jazz-tools";
import { beforeEach, describe, expect, it } from "vitest";
import { useDemoAuth } from "../auth/DemoAuth";
import { createJazzTestAccount, createJazzTestGuest } from "../testing";
import { act, renderHook } from "./testUtils";

KvStoreContext.getInstance().initialize(new InMemoryKVStore());

describe("useDemoAuth", () => {
  let authSecretStorage: AuthSecretStorage;

  beforeEach(async () => {
    KvStoreContext.getInstance().getStorage().clearAll();
    authSecretStorage = new AuthSecretStorage();

    const account = await createJazzTestAccount({
      isCurrentActiveAccount: true,
    });

    await authSecretStorage.set({
      accountID: account.id,
      secretSeed: new Uint8Array([1, 2, 3]),
      accountSecret: "test-secret" as any,
      provider: "anonymous",
    });
  });

  it("should initialize with anonymous state when using guest account", async () => {
    const guestAccount = await createJazzTestGuest();

    const { result } = renderHook(() => useDemoAuth(), {
      account: guestAccount,
    });

    expect(result.current.state).toBe("anonymous");
    expect(result.current.existingUsers).toEqual([]);
    expect(typeof result.current.logIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });

  it("should show signed in state with authenticated account", async () => {
    const account = Account.getMe();

    const { result } = renderHook(() => useDemoAuth(), {
      isAuthenticated: true,
    });

    expect(result.current.state).toBe("signedIn");
  });

  it("should update existing users list", async () => {
    const testUsername = "testuser";
    const { result } = renderHook(() => useDemoAuth());

    await act(async () => {
      await result.current.signUp(testUsername);
    });

    expect(result.current.existingUsers).toContain(testUsername);
  });

  it("should handle login for existing user", async () => {
    const testUsername = "testuser";

    const { result } = renderHook(() => useDemoAuth());

    await act(async () => {
      await result.current.signUp(testUsername);
    });

    const { result: newResult } = renderHook(() => useDemoAuth());

    // Then try to log in
    await act(async () => {
      await newResult.current.logIn(testUsername);
    });

    expect(newResult.current.state).toBe("signedIn");
  });

  it("should handle signup for new user", async () => {
    const testUsername = "newuser";

    const { result } = renderHook(() => useDemoAuth());

    await act(async () => {
      await result.current.signUp(testUsername);
    });

    expect(result.current.state).toBe("signedIn");
  });
});
