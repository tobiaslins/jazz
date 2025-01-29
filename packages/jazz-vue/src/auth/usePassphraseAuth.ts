import { PassphraseAuth } from "jazz-tools";
import { computed } from "vue";
import { useAuthSecretStorage, useJazzContext } from "../composables.js";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * `usePassphraseAuth` composable provides a `JazzAuth` object for passphrase authentication.
 *
 * @example
 * ```ts
 * const auth = usePassphraseAuth({ wordlist });
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
  const isAuthenticated = useIsAuthenticated();

  const authMethod = computed(() => {
    return new PassphraseAuth(
      context.value.node.crypto,
      context.value.authenticate,
      authSecretStorage,
      wordlist,
    );
  });

  return computed(() => ({
    state: isAuthenticated.value ? "signedIn" : "anonymous",
    logIn: authMethod.value.logIn,
    signUp: authMethod.value.signUp,
    getCurrentUserPassphrase: authMethod.value.getCurrentUserPassphrase,
  }));
}
