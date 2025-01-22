import { AuthSecretStorage } from "jazz-browser";
import { useEffect, useState } from "react";

export function useIsAnonymousUser() {
  const [isAnonymous, setIsAnonymous] = useState(() =>
    AuthSecretStorage.isAnonymous(),
  );

  useEffect(() => {
    function handleUpdate() {
      setIsAnonymous(AuthSecretStorage.isAnonymous());
    }

    return AuthSecretStorage.onUpdate(handleUpdate);
  }, []);

  return isAnonymous;
}
