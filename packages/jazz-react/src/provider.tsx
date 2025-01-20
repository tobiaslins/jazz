import {
  BaseBrowserContextOptions,
  BrowserContext,
  BrowserGuestContext,
  createJazzBrowserContext,
} from "jazz-browser";
import React, { useEffect } from "react";

import { JazzContext, JazzContextType } from "jazz-react-core";
import { Account, AccountClass, AuthMethod } from "jazz-tools";
import { useIsAnonymousUser } from "./auth/AnonymousAuth.js";

export interface Register {}

export type RegisteredAccount = Register extends { Account: infer Acc }
  ? Acc
  : Account;

export type JazzContextManagerProps<Acc extends Account = RegisteredAccount> = {
  auth?: AuthMethod | "guest";
  peer: `wss://${string}` | `ws://${string}`;
  localOnly?: boolean;
  storage?: BaseBrowserContextOptions["storage"];
  AccountSchema?: AccountClass<Acc>;
};

export type JazzProviderProps<Acc extends Account = RegisteredAccount> = {
  children: React.ReactNode;
  localOnly?: boolean | "anonymous";
} & Omit<JazzContextManagerProps<Acc>, "localOnly">;

class JazzContextManager<Acc extends Account = RegisteredAccount> {
  private value: JazzContextType<Acc> | undefined;
  private context: BrowserGuestContext | BrowserContext<Acc> | undefined;
  private props: JazzContextManagerProps<Acc> | undefined;

  lastCallId: number = 0;
  async createContext(props: JazzContextManagerProps<Acc>) {
    const callId = ++this.lastCallId;
    this.props = { ...props };

    const currentContext = await createJazzBrowserContext<Acc>(
      props.auth === "guest"
        ? {
            guest: true,
            peer: props.peer,
            storage: props.storage,
            localOnly: props.localOnly,
          }
        : {
            guest: false,
            AccountSchema: props.AccountSchema,
            auth: props.auth,
            peer: props.peer,
            storage: props.storage,
            localOnly: props.localOnly,
          },
    );

    if (callId !== this.lastCallId) {
      currentContext.done();
      return;
    }

    this.updateContext(props, currentContext);
  }

  updateContext(
    props: JazzContextManagerProps<Acc>,
    context: BrowserGuestContext | BrowserContext<Acc>,
  ) {
    this.context?.done();

    this.context = context;
    this.props = props;
    this.value = {
      ...context,
      refreshContext: this.refreshContext,
      logOut: this.logOut,
      AccountSchema:
        props.AccountSchema ?? (Account as unknown as AccountClass<Acc>),
    };

    this.notify();
  }

  propsChanged(props: JazzContextManagerProps<Acc>) {
    if (!this.props) {
      return true;
    }

    return Object.keys(props).some((key) => {
      // @ts-expect-error Dynamic compare
      return this.props[key] !== props[key];
    });
  }

  getCurrentValue() {
    return this.value;
  }

  toggleNetwork = (enabled: boolean) => {
    if (!this.context || !this.props) {
      return;
    }

    this.context.toggleNetwork?.(enabled);
    this.props.localOnly = enabled;
  };

  logOut = () => {
    if (!this.context || !this.props) {
      return;
    }

    this.context.logOut();
    return this.createContext(this.props);
  };

  done = () => {
    if (!this.context) {
      return;
    }

    this.context.done();
  };

  refreshContext = () => {
    if (!this.context || !this.props) {
      return;
    }

    return this.createContext(this.props);
  };

  listeners = new Set<() => void>();
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  };

  notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/** @category Context & Hooks */
export function JazzProvider<Acc extends Account = RegisteredAccount>({
  children,
  auth,
  peer,
  storage,
  AccountSchema = Account as unknown as AccountClass<Acc>,
  localOnly: localOnlyProp,
}: JazzProviderProps<Acc>) {
  const [contextManager] = React.useState(() => new JazzContextManager<Acc>());

  const isAnonymousUser = useIsAnonymousUser();
  const localOnly =
    localOnlyProp === "anonymous" ? isAnonymousUser : localOnlyProp;

  const value = React.useSyncExternalStore<JazzContextType<Acc> | undefined>(
    React.useCallback(
      (callback) => {
        const props = { AccountSchema, auth, peer, storage, localOnly };
        if (contextManager.propsChanged(props)) {
          contextManager.createContext(props).catch((error) => {
            console.error("Error creating Jazz browser context:", error);
          });
        }

        return contextManager.subscribe(callback);
      },
      [AccountSchema, auth, peer].concat(storage as any),
    ),
    () => contextManager.getCurrentValue(),
    () => contextManager.getCurrentValue(),
  );

  useEffect(() => {
    if (contextManager && process.env.NODE_ENV !== "development") {
      return () => {
        contextManager.done();
      };
    }
  }, [contextManager]);

  useEffect(() => {
    if (contextManager) {
      contextManager.toggleNetwork?.(!localOnly);
    }
  }, [value, localOnly]);

  return (
    <JazzContext.Provider value={value}>
      {value && children}
    </JazzContext.Provider>
  );
}
