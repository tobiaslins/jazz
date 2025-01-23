import { getJazzContext } from "$lib/jazz.svelte.js";
import { BrowserPasskeyAuth } from "jazz-browser";
import { useIsAnonymousUser } from "./useAnonymousUser.svelte.js";

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
  const auth = new BrowserPasskeyAuth(
    context.current.node.crypto,
    context.current.authenticate,
    appName,
    appHostname
  );
  
  const isAnonymousUser = useIsAnonymousUser();
  
  const state = $derived(isAnonymousUser.value ? "anonymous" : "signedIn");

  return {
    current: auth,
    get state() {
      return state;
    },
  };
}
