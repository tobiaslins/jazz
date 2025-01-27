import {
  JazzBrowserContextManager,
  JazzContextManagerProps,
} from "jazz-browser";
import React, { useEffect, useRef } from "react";

import { JazzContext } from "jazz-react-core";
import { Account, JazzContextType } from "jazz-tools";
import { useIsAuthenticated } from "./auth/useIsAuthenticated.js";

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
  onLogOut,
}: JazzProviderProps<Acc>) {
  const [contextManager] = React.useState(
    () => new JazzBrowserContextManager<Acc>(),
  );

  const isAuthenticated = useIsAuthenticated();
  const localOnly =
    localOnlyProp === "anonymous"
      ? isAuthenticated === false
      : localOnlyProp === "always";

  const onLogOutRef = React.useRef(onLogOut);
  onLogOutRef.current = onLogOut;
  // To keep the function reference stable while calling the latest version of onLogOut
  const onLogOutRefCallback = useRef(() => {
    onLogOutRef.current?.();
  }).current;

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
          onLogOut: onLogOutRefCallback,
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
