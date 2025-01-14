import { useContext } from "react";

import { BrowserPassphraseAuth } from "jazz-browser";
import { JazzContext } from "jazz-react-core";
import { useMemo } from "react";

import { useState } from "react";
import { useAnonymousUserUpgrade } from "./AnonymousAuth.js";

export type RecoveryKeyAuthState = (
  | { state: "uninitialized" }
  | { state: "loading" }
  | {
      state: "ready";
      logIn: (passphrase: string) => void;
    }
  | { state: "signedIn"; logOut: () => void }
) & {
  errors: string[];
};

export function useRecoveryKeyAuth({
  wordlist,
  onLogIn,
}: {
  wordlist: string[];
  onLogIn?: () => void;
}) {
  const [state, setState] = useState<RecoveryKeyAuthState>({
    state: "loading",
    errors: [],
  });

  const authMethod = useMemo(() => {
    return new BrowserPassphraseAuth(
      {
        onReady(next) {
          setState({
            state: "ready",
            logIn: next.logIn,
            errors: [],
          });
        },
        onSignedIn(next) {
          setState({
            state: "signedIn",
            logOut: () => {
              next.logOut();
              setState({ state: "loading", errors: [] });
            },
            errors: [],
          });
        },
        onError(error) {
          setState((state) => ({
            ...state,
            errors: [...state.errors, error.toString()],
          }));
        },
      },
      wordlist,
    );
  }, [wordlist]);

  useAnonymousUserUpgrade({
    auth: authMethod,
    onUpgrade: () => {
      onLogIn?.();
    },
  });

  return [authMethod, state] as const;
}
