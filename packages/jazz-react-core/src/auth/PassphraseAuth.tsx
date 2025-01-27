import { useAuthSecretStorage, useJazzContext } from "jazz-react-core";
import { PassphraseAuth } from "jazz-tools";
import { useMemo } from "react";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * `usePassphraseAuth` hook provides a `JazzAuth` object for passphrase authentication.
 *
 * @example
 * ```ts
 * const [auth, state] = usePassphraseAuth({ appName, appHostname, wordlist });
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

  const authMethod = useMemo(() => {
    return new PassphraseAuth(
      context.node.crypto,
      context.authenticate,
      context.register,
      authSecretStorage,
      wordlist,
    );
  }, [wordlist]);

  const isAuthenticated = useIsAuthenticated();
  return {
    state: isAuthenticated ? "signedIn" : "anonymous",
    logIn: authMethod.logIn,
    signUp: authMethod.signUp,
    generateRandomPassphrase: authMethod.generateRandomPassphrase,
    getCurrentUserPassphrase: authMethod.getCurrentUserPassphrase,
  } as const;
}
