import type { AgentSecret, LocalNode } from "cojson";
import type { Account } from "./exports.js";
import type { AnonymousJazzAgent, ID } from "./internal.js";

export type AuthCredentials = {
  accountID: ID<Account>;
  secretSeed?: Uint8Array;
  accountSecret: AgentSecret;
  provider?: "anonymous" | "clerk" | "demo" | "passkey" | "passphrase" | string;
};

export type AuthenticateAccountFunction = (
  credentials: AuthCredentials,
) => Promise<void>;
export type RegisterAccountFunction = (
  accountSecret: AgentSecret,
  creationProps: { name: string },
) => Promise<ID<Account>>;

/** @category Context Creation */
export type JazzAuthContext<Acc extends Account> = {
  me: Acc;
  node: LocalNode;
  toggleNetwork?: (enabled: boolean) => void;
  authenticate: AuthenticateAccountFunction;
  register: RegisterAccountFunction;
  logOut: () => void;
  done: () => void;
};

export type JazzGuestContext = {
  guest: AnonymousJazzAgent;
  node: LocalNode;
  toggleNetwork?: (enabled: boolean) => void;
  authenticate: (credentials: {
    accountID: ID<Account>;
    accountSecret: AgentSecret;
  }) => Promise<void>;
  register: (
    accountSecret: AgentSecret,
    creationProps: { name: string },
  ) => Promise<ID<Account>>;
  logOut: () => void;
  done: () => void;
};

export type JazzContextType<Acc extends Account> =
  | JazzAuthContext<Acc>
  | JazzGuestContext;
