import {
  Account,
  AnonymousJazzAgent,
  AuthSecretStorage,
  InMemoryKVStore,
  KvStoreContext,
} from "jazz-tools";
import { getJazzContextShape } from "jazz-tools/testing";
import { useMemo } from "react";
import { JazzAuthContext, JazzContext } from "./provider.js";

export function JazzTestProvider<Acc extends Account>({
  children,
  account = Account.getMe() as Acc,
  isAuthenticated,
}: {
  children: React.ReactNode;
  account?: Acc | { guest: AnonymousJazzAgent };
  isAuthenticated?: boolean;
}) {
  const value = useMemo(() => {
    return getJazzContextShape(account);
  }, [account]);

  const authSecretStorageValue = useMemo(() => {
    KvStoreContext.getInstance().initialize(new InMemoryKVStore());
    const storage = new AuthSecretStorage();

    if ("guest" in account) {
      return storage;
    }

    const accountID = account.id;
    const accountSecret = account._raw.core.node.account.agentSecret;

    storage.set({
      accountID,
      accountSecret,
      secretSeed: account._raw.core.crypto.newRandomSecretSeed(),
      provider: isAuthenticated ? "demo" : "anonymous",
    });
    storage.isAuthenticated = Boolean(isAuthenticated);

    return storage;
  }, [account, isAuthenticated]);

  return (
    <JazzContext.Provider value={value}>
      <JazzAuthContext.Provider value={authSecretStorageValue}>
        {children}
      </JazzAuthContext.Provider>
    </JazzContext.Provider>
  );
}

export {
  createJazzTestAccount,
  createJazzTestGuest,
  linkAccounts,
  setActiveAccount,
  setupJazzTestSync,
} from "jazz-tools/testing";
