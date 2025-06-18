import { LocalNode } from "cojson";
import { PureJSCrypto } from "cojson/dist/crypto/PureJSCrypto";
import {
  Account,
  AccountClass,
  type AnonymousJazzAgent,
  AnyAccountSchema,
  CoValueFromRaw,
  InstanceOfSchema,
  JazzContextManager,
  JazzContextManagerAuthProps,
  JazzContextManagerBaseProps,
} from "./internal.js";
export declare class TestJSCrypto extends PureJSCrypto {
  static create(): Promise<PureJSCrypto>;
}
export declare function getPeerConnectedToTestSyncServer(): import(
  "cojson",
).Peer;
export declare function createJazzTestAccount<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>(options?: {
  isCurrentActiveAccount?: boolean;
  AccountSchema?: S;
  creationProps?: Record<string, unknown>;
}): Promise<InstanceOfSchema<S>>;
export declare function setActiveAccount(account: Account): void;
export declare function createJazzTestGuest(): Promise<{
  guest: AnonymousJazzAgent;
}>;
export type TestJazzContextManagerProps<Acc extends Account> =
  JazzContextManagerBaseProps<Acc> & {
    defaultProfileName?: string;
    AccountSchema?: AccountClass<Acc> & CoValueFromRaw<Acc>;
    isAuthenticated?: boolean;
  };
export declare class TestJazzContextManager<
  Acc extends Account,
> extends JazzContextManager<Acc, TestJazzContextManagerProps<Acc>> {
  static fromAccountOrGuest<Acc extends Account>(
    account?:
      | Acc
      | {
          guest: AnonymousJazzAgent;
        },
    props?: TestJazzContextManagerProps<Acc>,
  ): TestJazzContextManager<Acc>;
  static fromAccount<Acc extends Account>(
    account: Acc,
    props?: TestJazzContextManagerProps<Acc>,
  ): TestJazzContextManager<Acc>;
  static fromGuest<Acc extends Account>(
    {
      guest,
    }: {
      guest: AnonymousJazzAgent;
    },
    props?: TestJazzContextManagerProps<Acc>,
  ): TestJazzContextManager<Acc>;
  getNewContext(
    props: TestJazzContextManagerProps<Acc>,
    authProps?: JazzContextManagerAuthProps,
  ): Promise<{
    me: import("./internal.js").CoValueClass<Acc> & {
      fromNode: (typeof Account)["fromNode"];
    } & CoValueFromRaw<Acc> extends infer T
      ? T extends import("./internal.js").CoValueClass<Acc> & {
          fromNode: (typeof Account)["fromNode"];
        } & CoValueFromRaw<Acc>
        ? T extends import("./internal.js").CoValueClass<
            import("./internal.js").CoValue
          >
          ? InstanceType<T>
          : never
        : never
      : never;
    node: LocalNode;
    done: () => void;
    logOut: () => Promise<void>;
  }>;
}
export declare function linkAccounts(
  a: Account,
  b: Account,
  aRole?: "server" | "client",
  bRole?: "server" | "client",
): Promise<void>;
export declare function setupJazzTestSync(): Promise<Account>;
