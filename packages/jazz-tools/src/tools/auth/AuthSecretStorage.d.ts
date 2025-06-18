import { AgentSecret } from "cojson";
import type { Account } from "../coValues/account.js";
import type { ID } from "../internal.js";
import { AuthCredentials } from "../types.js";
export type AuthSetPayload = {
  accountID: ID<Account>;
  secretSeed?: Uint8Array;
  accountSecret: AgentSecret;
  provider:
    | "anonymous"
    | "clerk"
    | "betterauth"
    | "demo"
    | "passkey"
    | "passphrase"
    | string;
};
export declare class AuthSecretStorage {
  private listeners;
  isAuthenticated: boolean;
  constructor();
  migrate(): Promise<void>;
  get(): Promise<AuthCredentials | null>;
  setWithoutNotify(payload: AuthSetPayload): Promise<void>;
  set(payload: AuthSetPayload): Promise<void>;
  getIsAuthenticated(data: AuthCredentials | null): boolean;
  onUpdate(handler: (isAuthenticated: boolean) => void): () => void;
  emitUpdate(data: AuthCredentials | null): void;
  clearWithoutNotify(): Promise<void>;
  clear(): Promise<void>;
}
