import { AuthSecretStorage, BrowserAnonymousAuth } from "jazz-browser";
import { JazzContext } from "jazz-react-core";
import { AuthMethod } from "jazz-tools";
import { useContext, useEffect, useMemo, useState } from "react";
import { useAccount } from "../hooks.js";

type AnonymousAuthState = (
  | {
      state: "uninitialized";
    }
  | {
      state: "loading";
    }
  | {
      state: "ready";
    }
  | {
      state: "signedIn";
      logOut: () => void;
    }
) & {
  errors: string[];
};

/**
 * `useOnboardingAuth` is a hook that provides a `JazzAuth` object for zero-interaction authentication.
 *
 *
 * ```ts
 * const [auth, state] = useOnboardingAuth();
 * ```
 *
 * @category Auth Providers
 */
export function useOnboardingAuth(
  {
    defaultUserName,
  }: {
    defaultUserName: string;
  } = {
    defaultUserName: "Anonymous user",
  },
) {
  const [state, setState] = useState<AnonymousAuthState>({
    state: "loading",
    errors: [],
  });

  const authMethod = useMemo(() => {
    return new BrowserAnonymousAuth(defaultUserName, {
      onSignedIn: ({ logOut }) => {
        setState({ state: "signedIn", logOut, errors: [] });
      },
      onError: (error) => {
        setState((current) => ({
          ...current,
          errors: [...current.errors, error.toString()],
        }));
      },
    });
  }, [defaultUserName]);

  return [authMethod, state] as const;
}

export type AnonymousUserUpgradeProps = {
  username: string;
  isSignUp: boolean;
  isLogIn: boolean;
};

export function useAnonymousUserUpgrade({
  auth,
  onUpgrade,
}: {
  auth: AuthMethod;
  onUpgrade: (props: AnonymousUserUpgradeProps) => void;
}) {
  const { me } = useAccount();
  const context = useContext(JazzContext);

  useEffect(() => {
    if (!context) return;

    const runAuth = async () => {
      const result = await auth.start(me._raw.core.node.crypto);

      if (result.type === "new") {
        throw new Error(
          "An onboarding upgrade should not be called for a new user",
        );
      }

      await result.saveCredentials?.({
        accountID: result.credentials.accountID,
        secret: result.credentials.secret,
      });

      result.onSuccess();

      const isSignUp = result.credentials.accountID === me.id;

      if (!isSignUp) {
        context.refreshContext?.();
      }

      onUpgrade({
        username: result.username ?? "",
        isSignUp,
        isLogIn: !isSignUp,
      });
    };

    runAuth();
  }, [auth]);
}

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
