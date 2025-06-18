import { AgentSecret, LocalNode } from "cojson";
import { AuthSecretStorage } from "../auth/AuthSecretStorage.js";
import { KvStore } from "../auth/KvStoreContext.js";
import { Account } from "../coValues/account.js";
import { AuthCredentials } from "../types.js";
import { JazzContextType } from "../types.js";
import { AnonymousJazzAgent } from "./anonymousJazzAgent.js";
export type JazzContextManagerAuthProps = {
  credentials?: AuthCredentials;
  newAccountProps?: {
    secret: AgentSecret;
    creationProps: {
      name: string;
    };
  };
};
export type JazzContextManagerBaseProps<Acc extends Account> = {
  onAnonymousAccountDiscarded?: (anonymousAccount: Acc) => Promise<void>;
  onLogOut?: () => void | Promise<unknown>;
  logOutReplacement?: () => void | Promise<unknown>;
};
type PlatformSpecificAuthContext<Acc extends Account> = {
  me: Acc;
  node: LocalNode;
  logOut: () => Promise<void>;
  done: () => void;
};
type PlatformSpecificGuestContext = {
  guest: AnonymousJazzAgent;
  node: LocalNode;
  logOut: () => Promise<void>;
  done: () => void;
};
type PlatformSpecificContext<Acc extends Account> =
  | PlatformSpecificAuthContext<Acc>
  | PlatformSpecificGuestContext;
export declare class JazzContextManager<
  Acc extends Account,
  P extends JazzContextManagerBaseProps<Acc>,
> {
  protected value: JazzContextType<Acc> | undefined;
  protected context: PlatformSpecificContext<Acc> | undefined;
  protected props: P | undefined;
  protected authSecretStorage: AuthSecretStorage;
  protected keepContextOpen: boolean;
  contextPromise: Promise<void> | undefined;
  constructor(opts?: {
    useAnonymousFallback?: boolean;
  });
  getKvStore(): KvStore;
  createContext(
    props: P,
    authProps?: JazzContextManagerAuthProps,
  ): Promise<void>;
  getNewContext(
    props: P,
    authProps?: JazzContextManagerAuthProps,
  ): Promise<PlatformSpecificContext<Acc>>;
  updateContext(
    props: P,
    context: PlatformSpecificContext<Acc>,
    authProps?: JazzContextManagerAuthProps,
  ): Promise<void>;
  propsChanged(props: P): void;
  getCurrentValue(): JazzContextType<Acc> | undefined;
  setCurrentValue(value: JazzContextType<Acc>): void;
  getAuthSecretStorage(): AuthSecretStorage;
  logOut: () => Promise<void>;
  done: () => void;
  shouldMigrateAnonymousAccount: () => Promise<boolean>;
  /**
   * Authenticates the user with the given credentials
   */
  authenticate: (credentials: AuthCredentials) => Promise<void>;
  register: (
    accountSecret: AgentSecret,
    creationProps: {
      name: string;
    },
  ) => Promise<string>;
  private handleAnonymousAccountMigration;
  listeners: Set<() => void>;
  subscribe: (callback: () => void) => () => void;
  notify(): void;
}
export {};
