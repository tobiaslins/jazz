import { BrowserOnboardingAuth } from "jazz-browser";
import { useJazzContext } from "jazz-react-core";
import { AuthMethod } from "jazz-tools";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "../hooks.js";

type OnboardingAuthState = (
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
  const [state, setState] = useState<OnboardingAuthState>({
    state: "loading",
    errors: [],
  });

  const authMethod = useMemo(() => {
    return new BrowserOnboardingAuth(defaultUserName, {
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

export function useOnboardingAuthUpgrade({
  auth,
  onUpgrade,
}: {
  auth: AuthMethod;
  onUpgrade: (props: {
    username: string;
    isSignUp: boolean;
    isLogIn: boolean;
  }) => void;
}) {
  const { me } = useAccount();
  const context = useJazzContext();

  useEffect(() => {
    async function runAuth() {
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

      BrowserOnboardingAuth.emitUpdate();

      onUpgrade({
        username: result.username ?? "",
        isSignUp,
        isLogIn: !isSignUp,
      });
    }

    runAuth();
  }, [auth]);
}

export function useIsUserOnboarding() {
  const [isOnboarding, setIsOnboarding] = useState(() =>
    BrowserOnboardingAuth.isUserOnboarding(),
  );

  useEffect(() => {
    function handleUpdate() {
      setIsOnboarding(BrowserOnboardingAuth.isUserOnboarding());
    }

    return BrowserOnboardingAuth.onUpdate(handleUpdate);
  }, []);

  return isOnboarding;
}
