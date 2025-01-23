import {
  BrowserClerkAuth,
  type MinimalClerkClient,
} from "jazz-browser-auth-clerk";
import { useJazzContext } from "jazz-react";
import { useEffect, useMemo } from "react";

export function useJazzClerkAuth(
  clerk: MinimalClerkClient & {
    signOut: () => Promise<unknown>;
  },
) {
  const context = useJazzContext();

  const authMethod = useMemo(() => {
    return new BrowserClerkAuth(context.authenticate);
  }, []);

  useEffect(() => {
    authMethod.onClerkUserChange(clerk);
  }, [clerk.user]);
}
