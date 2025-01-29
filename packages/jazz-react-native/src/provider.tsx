import { JazzAuthContext, JazzContext } from "jazz-react-core";
import { Account, JazzContextType, KvStore } from "jazz-tools";
import React, { useEffect, useRef } from "react";
import { JazzContextManagerProps } from "./ReactNativeContextManager.js";
import { ReactNativeContextManager } from "./ReactNativeContextManager.js";
import { setupKvStore } from "./platform.js";

export interface Register {}

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

export type JazzProviderProps<Acc extends Account = RegisteredAccount> = {
  children: React.ReactNode;
  kvStore?: KvStore;
} & JazzContextManagerProps<Acc>;

/** @category Context & Hooks */
export function JazzProvider<Acc extends Account = RegisteredAccount>({
  children,
  guestMode,
  sync,
  storage,
  AccountSchema,
  defaultProfileName,
  onLogOut,
  kvStore,
}: JazzProviderProps<Acc>) {
  setupKvStore(kvStore);

  const [contextManager] = React.useState(
    () => new ReactNativeContextManager<Acc>(),
  );

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
          sync,
          storage,
          defaultProfileName,
          onLogOut: onLogOutRefCallback,
        };
        if (contextManager.propsChanged(props)) {
          contextManager.createContext(props).catch((error) => {
            console.log(error.stack);
            console.error("Error creating Jazz context:", error);
          });
        }

        return contextManager.subscribe(callback);
      },
      [sync, guestMode].concat(storage as any),
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

  return (
    <JazzContext.Provider value={value}>
      <JazzAuthContext.Provider value={contextManager.getAuthSecretStorage()}>
        {value && children}
      </JazzAuthContext.Provider>
    </JazzContext.Provider>
  );
}
