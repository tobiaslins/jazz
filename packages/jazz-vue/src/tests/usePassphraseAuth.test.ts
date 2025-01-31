// @vitest-environment happy-dom

import { mnemonicToEntropy } from "@scure/bip39";
import { AuthSecretStorage, CoMap, ID, KvStoreContext, co } from "jazz-tools";
import { createJazzTestAccount, setupJazzTestSync } from "jazz-tools/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useCoState, usePassphraseAuth } from "../index.js";
import { testWordlist } from "./fixtures.js";
import { waitFor, withJazzTestSetup } from "./testUtils.js";

describe("usePassphraseAuth", () => {
  beforeEach(async () => {
    await setupJazzTestSync();
    await createJazzTestAccount({
      isCurrentActiveAccount: true,
    });
  });

  afterEach(() => {
    KvStoreContext.getInstance().getStorage().clearAll();
  });

  it("should show anonymous in state with non-authenticated account", async () => {
    const [result] = withJazzTestSetup(
      () => usePassphraseAuth({ wordlist: testWordlist }),
      {
        isAuthenticated: false,
      },
    );

    expect(result.value.state).toBe("anonymous");
  });

  it("should show signed in state with authenticated account", async () => {
    const [result] = withJazzTestSetup(
      () => usePassphraseAuth({ wordlist: testWordlist }),
      {
        isAuthenticated: true,
      },
    );

    expect(result.value.state).toBe("signedIn");
  });

  it("should sign up with the current credentials", async () => {
    const [result] = withJazzTestSetup(() =>
      usePassphraseAuth({ wordlist: testWordlist }),
    );

    const authSecretStorage = new AuthSecretStorage();
    const credentialsBefore = await authSecretStorage.get();

    const passphrase = await result.value.signUp();

    expect(result.value.state).toBe("signedIn");
    expect(await authSecretStorage.get()).toEqual({
      ...credentialsBefore,
      provider: "passphrase",
    });
    expect(mnemonicToEntropy(passphrase, testWordlist)).toEqual(
      credentialsBefore?.secretSeed,
    );
  });

  it("should log in with the previous passphrase", async () => {
    const [result] = withJazzTestSetup(() =>
      usePassphraseAuth({ wordlist: testWordlist }),
    );

    const authSecretStorage = new AuthSecretStorage();
    const credentialsBefore = await authSecretStorage.get();

    const passphrase = await result.value.signUp();

    await result.value.logIn(passphrase);

    expect(result.value.state).toBe("signedIn");
    expect(await authSecretStorage.get()).toMatchObject({
      ...credentialsBefore,
      provider: "passphrase",
    });
  });
});
