import { getAuthSecretStorage, getJazzContext } from "$lib/jazz.svelte.js";
import { BrowserPasskeyAuth } from "jazz-browser";
import { useIsAuthenticated } from "./useIsAuthenticated.svelte.js";

export type PasskeyAuth = {
  current: BrowserPasskeyAuth;
  state: "anonymous" | "signedIn";
};

/** @category Auth Providers */
export function usePasskeyAuth({
  appName,
  appHostname,
}: {
  appName: string;
  appHostname?: string;
}): PasskeyAuth {
  const context = getJazzContext();
  const authSecretStorage = getAuthSecretStorage();
  const auth = new BrowserPasskeyAuth(
    context.current.node.crypto,
    context.current.authenticate,
    authSecretStorage,
    appName,
    appHostname
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
