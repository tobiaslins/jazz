import { useAuthSecretStorage, useJazzContext } from "jazz-react-core";
import { DemoAuth } from "jazz-tools";
import { useEffect, useMemo, useState } from "react";
import { useIsAuthenticated } from "./useIsAuthenticated.js";

/**
 * `useDemoAuth` is a hook that provides a `JazzAuth` object for demo authentication.
 *
 *
 * ```ts
 * const [auth, state] = useDemoAuth();
 * ```
 *
 * @category Auth Providers
 */
export function useDemoAuth() {
  const context = useJazzContext();
  const authSecretStorage = useAuthSecretStorage();

  const authMethod = useMemo(() => {
    return new DemoAuth(context.authenticate, authSecretStorage);
  }, []);

  const isAuthenticated = useIsAuthenticated();
  const [existingUsers, setExistingUsers] = useState<string[]>([]);

  useEffect(() => {
    authMethod.getExistingUsers().then(setExistingUsers);
  }, [authMethod]);

  return {
    state: isAuthenticated ? "signedIn" : "anonymous",
    logIn: authMethod.logIn,
    signUp: authMethod.signUp,
    existingUsers,
  } as const;
}
