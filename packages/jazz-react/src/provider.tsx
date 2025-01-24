import {
  JazzBrowserContextManager,
  JazzContextManagerProps,
} from "jazz-browser";
import React, { useEffect } from "react";

import { JazzContext } from "jazz-react-core";
import { Account, JazzContextType } from "jazz-tools";
import { useIsAnonymousUser } from "./auth/AnonymousAuth.js";

export interface Register {}

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

export type JazzProviderProps<Acc extends Account = RegisteredAccount> = {
  children: React.ReactNode;
  localOnly?: "always" | "anonymous" | "off";
} & Omit<JazzContextManagerProps<Acc>, "localOnly">;

/** @category Context & Hooks */
export function JazzProvider<Acc extends Account = RegisteredAccount>({
  children,
  guestMode,
  peer,
  storage,
  AccountSchema,
  localOnly: localOnlyProp,
  defaultProfileName,
}: JazzProviderProps<Acc>) {
  const [contextManager] = React.useState(
    () => new JazzBrowserContextManager<Acc>(),
  );

  const isAnonymousUser = useIsAnonymousUser();
  const localOnly =
    localOnlyProp === "anonymous"
      ? isAnonymousUser
      : localOnlyProp === "always";

  const value = React.useSyncExternalStore<JazzContextType<Acc> | undefined>(
    React.useCallback(
      (callback) => {
        const props = {
          AccountSchema,
          guestMode,
          peer,
          storage,
          localOnly,
          defaultProfileName,
        };
        if (contextManager.propsChanged(props)) {
          contextManager.createContext(props).catch((error) => {
            console.error("Error creating Jazz browser context:", error);
          });
        }

        return contextManager.subscribe(callback);
      },
      [peer, guestMode].concat(storage as any),
    ),
    () => contextManager.getCurrentValue(),
    () => contextManager.getCurrentValue(),
  );

  useEffect(() => {
    // In development mode we don't return a cleanup function because otherwise
    // the double effect execution would mark the context as done immediately.
    if (process.env.NODE_ENV === "development") return;

    return () => {
      contextManager.done();
    };
  }, []);

  useEffect(() => {
    contextManager.toggleNetwork(!localOnly);
  }, [value, localOnly]);

  return (
    <JazzContext.Provider value={value}>
      {value && children}
    </JazzContext.Provider>
  );
}
