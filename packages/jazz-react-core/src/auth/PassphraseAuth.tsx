import { PassphraseAuth } from "jazz-tools";
import { useMemo } from "react";
import { useAuthSecretStorage, useJazzContext } from "../hooks.js";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * `usePassphraseAuth` hook provides a `JazzAuth` object for passphrase authentication.
 *
 * @example
 * ```ts
 * const auth = usePassphraseAuth({ appName, appHostname, wordlist });
 * ```
 *
 * @category Auth Providers
 */
export function usePassphraseAuth({
  wordlist,
}: {
  wordlist: string[];
}) {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  if ("guest" in context) {
    throw new Error("Passphrase auth is not supported in guest mode");
  }

  const authMethod = useMemo(() => {
    return new PassphraseAuth(
      context.node.crypto,
      context.authenticate,
      authSecretStorage,
      wordlist,
    );
  }, [wordlist]);

  const isAuthenticated = useIsAuthenticated();
  return {
    state: isAuthenticated ? "signedIn" : "anonymous",
    logIn: authMethod.logIn,
    signUp: authMethod.signUp,
    getCurrentAccountPassphrase: authMethod.getCurrentAccountPassphrase,
  } as const;
}
