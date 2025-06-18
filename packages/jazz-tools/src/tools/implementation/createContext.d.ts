import {
  AgentSecret,
  CryptoProvider,
  LocalNode,
  Peer,
  RawAccountID,
  SessionID,
} from "cojson";
import { AuthSecretStorage } from "../auth/AuthSecretStorage.js";
import { type Account, type AccountClass } from "../coValues/account.js";
import {
  type AnyAccountSchema,
  CoValueFromRaw,
  type ID,
  type InstanceOfSchema,
} from "../internal.js";
import { AuthCredentials, NewAccountProps } from "../types.js";
import { AnonymousJazzAgent } from "./anonymousJazzAgent.js";
export type Credentials = {
  accountID: ID<Account>;
  secret: AgentSecret;
};
type SessionProvider = (
  accountID: ID<Account>,
  crypto: CryptoProvider,
) => Promise<{
  sessionID: SessionID;
  sessionDone: () => void;
}>;
export type AuthResult =
  | {
      type: "existing";
      username?: string;
      credentials: Credentials;
      saveCredentials?: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => Promise<void>;
    }
  | {
      type: "new";
      creationProps: {
        name: string;
        anonymous?: boolean;
        other?: Record<string, unknown>;
      };
      initialSecret?: AgentSecret;
      saveCredentials: (credentials: Credentials) => Promise<void>;
      onSuccess: () => void;
      onError: (error: string | Error) => void;
      logOut: () => Promise<void>;
    };
export declare function randomSessionProvider(
  accountID: ID<Account>,
  crypto: CryptoProvider,
): Promise<{
  sessionID:
    | `${RawAccountID}_session_z${string}`
    | `sealer_z${string}/signer_z${string}_session_z${string}`;
  sessionDone: () => void;
}>;
export type JazzContextWithAccount<Acc extends Account> = {
  node: LocalNode;
  account: Acc;
  done: () => void;
  logOut: () => Promise<void>;
};
export type JazzContextWithAgent = {
  agent: AnonymousJazzAgent;
  done: () => void;
  logOut: () => Promise<void>;
};
export type JazzContext<Acc extends Account> =
  | JazzContextWithAccount<Acc>
  | JazzContextWithAgent;
export declare function createJazzContextFromExistingCredentials<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>({
  credentials,
  peersToLoadFrom,
  crypto,
  AccountSchema: PropsAccountSchema,
  sessionProvider,
  onLogOut,
}: {
  credentials: Credentials;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  AccountSchema?: S;
  sessionProvider: SessionProvider;
  onLogOut?: () => void;
}): Promise<JazzContextWithAccount<InstanceOfSchema<S>>>;
export declare function createJazzContextForNewAccount<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>({
  creationProps,
  initialAgentSecret,
  peersToLoadFrom,
  crypto,
  AccountSchema: PropsAccountSchema,
  onLogOut,
}: {
  creationProps: {
    name: string;
  };
  initialAgentSecret?: AgentSecret;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  AccountSchema?: S;
  onLogOut?: () => Promise<void>;
}): Promise<JazzContextWithAccount<InstanceOfSchema<S>>>;
export declare function createJazzContext<
  S extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>(options: {
  credentials?: AuthCredentials;
  newAccountProps?: NewAccountProps;
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
  defaultProfileName?: string;
  AccountSchema?: S;
  sessionProvider: SessionProvider;
  authSecretStorage: AuthSecretStorage;
}): Promise<{
  authSecretStorage: AuthSecretStorage;
  node: LocalNode;
  account: InstanceOfSchema<S>;
  done: () => void;
  logOut: () => Promise<void>;
}>;
export declare function createAnonymousJazzContext({
  peersToLoadFrom,
  crypto,
}: {
  peersToLoadFrom: Peer[];
  crypto: CryptoProvider;
}): JazzContextWithAgent;
export {};
