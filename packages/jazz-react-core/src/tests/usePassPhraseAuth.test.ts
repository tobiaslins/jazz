// @vitest-environment happy-dom

import {
  Account,
  AuthSecretStorage,
  InMemoryKVStore,
  KvStoreContext,
} from "jazz-tools";
import { beforeEach, describe, expect, it } from "vitest";
import { usePassphraseAuth } from "../auth/PassphraseAuth";
import { createJazzTestAccount, createJazzTestGuest } from "../testing";
import { act, renderHook } from "./testUtils";

KvStoreContext.getInstance().initialize(new InMemoryKVStore());

describe("usePassphraseAuth", () => {
  const testWordlist = ["apple", "banana", "cherry", "date", "elderberry"];

  beforeEach(async () => {
    KvStoreContext.getInstance().getStorage().clearAll();

    await createJazzTestAccount({
      isCurrentActiveAccount: true,
    });
  });

  it("should initialize with anonymous state when using guest account", async () => {
    const guestAccount = await createJazzTestGuest();

    const { result } = renderHook(
      () => usePassphraseAuth({ wordlist: testWordlist }),
      {
        account: guestAccount,
      },
    );

    expect(result.current.state).toBe("anonymous");
    expect(typeof result.current.logIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(typeof result.current.generateRandomPassphrase).toBe("function");
    expect(typeof result.current.getCurrentUserPassphrase).toBe("function");
  });

  it("should show signed in state with authenticated account", async () => {
    const { result } = renderHook(
      () => usePassphraseAuth({ wordlist: testWordlist }),
      {
        isAuthenticated: true,
      },
    );

    expect(result.current.state).toBe("signedIn");
  });
});
