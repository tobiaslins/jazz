import {
  Account,
  AccountClass,
  AnyAccountSchema,
  CoValueFromRaw,
  InMemoryKVStore,
  InstanceOfSchema,
  JazzContextManager,
  SyncConfig,
} from "jazz-tools";
import { JazzContextManagerAuthProps } from "jazz-tools";
import { LocalStorageKVStore } from "./auth/LocalStorageKVStore.js";
import { BaseBrowserContextOptions } from "./createBrowserContext.js";
export type JazzContextManagerProps<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
> = {
  guestMode?: boolean;
  sync: SyncConfig;
  onLogOut?: () => void;
  logOutReplacement?: () => void;
  onAnonymousAccountDiscarded?: (
    anonymousAccount: InstanceOfSchema<S>,
  ) => Promise<void>;
  storage?: BaseBrowserContextOptions["storage"];
  AccountSchema?: S;
  defaultProfileName?: string;
};
export declare class JazzBrowserContextManager<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
> extends JazzContextManager<InstanceOfSchema<S>, JazzContextManagerProps<S>> {
  getKvStore(): InMemoryKVStore | LocalStorageKVStore;
  getNewContext(
    props: JazzContextManagerProps<S>,
    authProps?: JazzContextManagerAuthProps,
  ): Promise<
    | {
        guest: import("jazz-tools").AnonymousJazzAgent;
        node: import("cojson").LocalNode;
        done: () => void;
        logOut: () => Promise<void>;
      }
    | {
        me: InstanceOfSchema<S>;
        node: import("cojson").LocalNode;
        authSecretStorage: import("jazz-tools").AuthSecretStorage;
        done: () => void;
        logOut: () => Promise<void>;
      }
  >;
  propsChanged(props: JazzContextManagerProps<S>): boolean;
}
