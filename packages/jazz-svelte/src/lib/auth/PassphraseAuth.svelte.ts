import { getAuthSecretStorage, getJazzContext } from "../jazz.svelte.js";
import { useIsAuthenticated } from "./useIsAuthenticated.svelte.js";
import { PassphraseAuth as PassphraseAuthProvider } from "jazz-tools";

export type PassphraseAuth = {
  current: PassphraseAuthProvider;
  state: "anonymous" | "signedIn";
};

/** @category Auth Providers */
export function usePassphraseAuth({
  wordlist,
}: {
  wordlist: string[];
}): PassphraseAuth {
  const context = getJazzContext();
  const authSecretStorage = getAuthSecretStorage();
  const auth = new PassphraseAuthProvider(
    context.current.node.crypto,
    context.current.authenticate,
    authSecretStorage,
    wordlist
  );
  
  const isAuthenticated = useIsAuthenticated();
  
  const state = $derived(isAuthenticated.value ? "signedIn" : "anonymous");

  return {
    current: auth,
    get state() {
      return state;
    },
  };
}
