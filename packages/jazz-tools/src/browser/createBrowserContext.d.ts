import { LocalNode, RawAccountID } from "cojson";
import {
  Account,
  AccountClass,
  AgentID,
  AnyAccountSchema,
  AuthCredentials,
  AuthSecretStorage,
  CoValue,
  CoValueFromRaw,
  CryptoProvider,
  ID,
  InviteSecret,
  NewAccountProps,
  SessionID,
  SyncConfig,
} from "jazz-tools";
import { StorageConfig } from "./storageOptions.js";
export type BaseBrowserContextOptions = {
  sync: SyncConfig;
  reconnectionTimeout?: number;
  storage?: StorageConfig;
  crypto?: CryptoProvider;
  authSecretStorage: AuthSecretStorage;
};
export declare function createJazzBrowserGuestContext(
  options: BaseBrowserContextOptions,
): Promise<{
  guest: import("jazz-tools").AnonymousJazzAgent;
  node: LocalNode;
  done: () => void;
  logOut: () => Promise<void>;
}>;
export type BrowserContextOptions<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
> = {
  credentials?: AuthCredentials;
  AccountSchema?: S;
  newAccountProps?: NewAccountProps;
  defaultProfileName?: string;
} & BaseBrowserContextOptions;
export declare function createJazzBrowserContext<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>(
  options: BrowserContextOptions<S>,
): Promise<{
  me: import("jazz-tools").InstanceOfSchema<S>;
  node: LocalNode;
  authSecretStorage: AuthSecretStorage;
  done: () => void;
  logOut: () => Promise<void>;
}>;
/** @category Auth Providers */
export type SessionProvider = (
  accountID: ID<Account> | AgentID,
) => Promise<SessionID>;
export declare function provideBrowserLockSession(
  accountID: ID<Account> | AgentID,
  crypto: CryptoProvider,
): Promise<{
  sessionID:
    | `${RawAccountID}_session_z${string}`
    | `sealer_z${string}/signer_z${string}_session_z${string}`;
  sessionDone: () => void;
}>;
/** @category Invite Links */
export declare function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin" | "writeOnly",
  {
    baseURL,
    valueHint,
  }?: {
    baseURL?: string;
    valueHint?: string;
  },
): string;
/** @category Invite Links */
export declare function parseInviteLink<C extends CoValue>(
  inviteURL: string,
):
  | {
      valueID: ID<C>;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined;
