import { Account, AnonymousJazzAgent, AuthSecretStorage } from "jazz-tools";
import { getJazzContextShape } from "jazz-tools/testing";
import { useMemo } from "react";
import { JazzAuthContext, JazzContext } from "./provider.js";

export function JazzTestProvider<Acc extends Account>({
  children,
  account,
}: {
  children: React.ReactNode;
  account: Acc | { guest: AnonymousJazzAgent };
}) {
  const value = useMemo(() => {
    return getJazzContextShape(account);
  }, [account]);

  const authSecretStorage = useMemo(() => {
    return new AuthSecretStorage();
  }, []);

  return (
    <JazzContext.Provider value={value}>
      <JazzAuthContext.Provider value={authSecretStorage}>
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
