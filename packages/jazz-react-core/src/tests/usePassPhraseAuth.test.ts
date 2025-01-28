// @vitest-environment happy-dom

import { mnemonicToEntropy } from "@scure/bip39";
import {
  Account,
  AuthSecretStorage,
  InMemoryKVStore,
  KvStoreContext,
} from "jazz-tools";
import { testWordlist } from "jazz-tools/src/tests/fixtures.js";
import { beforeEach, describe, expect, it } from "vitest";
import { usePassphraseAuth } from "../auth/PassphraseAuth";
import { createJazzTestAccount, createJazzTestGuest } from "../testing";
import { act, renderHook } from "./testUtils";

KvStoreContext.getInstance().initialize(new InMemoryKVStore());

describe("usePassphraseAuth", () => {
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

  it("should sign up with the current credentials", async () => {
    const { result } = renderHook(() =>
      usePassphraseAuth({ wordlist: testWordlist }),
    );

    const authSecretStorage = new AuthSecretStorage();
    const credentialsBefore = await authSecretStorage.get();

    let passphrase = "";

    await act(async () => {
      passphrase = await result.current.signUp();
    });

    expect(result.current.state).toBe("signedIn");
    expect(await authSecretStorage.get()).toEqual({
      ...credentialsBefore,
      provider: "passphrase",
    });
    expect(mnemonicToEntropy(passphrase, testWordlist)).toEqual(
      credentialsBefore?.secretSeed,
    );
  });

  it("should log in with the previous passphrase", async () => {
    const { result } = renderHook(() =>
      usePassphraseAuth({ wordlist: testWordlist }),
    );

    const authSecretStorage = new AuthSecretStorage();
    const credentialsBefore = await authSecretStorage.get();

    let passphrase = "";

    await act(async () => {
      passphrase = await result.current.signUp();
    });

    await act(async () => {
      await result.current.logIn(passphrase);
    });

    expect(result.current.state).toBe("signedIn");
    expect(await authSecretStorage.get()).toMatchObject({
      secretSeed: credentialsBefore?.secretSeed,
      provider: "passphrase",
    });
  });
});
