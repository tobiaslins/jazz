import { AuthSecretStorage } from "jazz-browser";
import { useEffect, useState } from "react";

export function useIsAuthenticated() {
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    AuthSecretStorage.isAuthenticated(),
  );

  useEffect(() => {
    function handleUpdate() {
      setIsAuthenticated(AuthSecretStorage.isAuthenticated());
    }

    return AuthSecretStorage.onUpdate(handleUpdate);
  }, []);

  return isAuthenticated;
}
