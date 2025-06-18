import { CryptoProvider } from "cojson";
import type {
  AuthenticateAccountFunction,
  RegisterAccountFunction,
} from "../types.js";
import { AuthSecretStorage } from "./AuthSecretStorage.js";
/**
 * `PassphraseAuth` provides a `JazzAuth` object for passphrase authentication.
 *
 * ```ts
 * import { PassphraseAuth } from "jazz-tools";
 *
 * const auth = new PassphraseAuth(crypto, jazzContext.authenticate, new AuthSecretStorage(), wordlist);
 * ```
 *
 * @category Auth Providers
 */
export declare class PassphraseAuth {
  private crypto;
  private authenticate;
  private register;
  private authSecretStorage;
  wordlist: string[];
  passphrase: string;
  constructor(
    crypto: CryptoProvider,
    authenticate: AuthenticateAccountFunction,
    register: RegisterAccountFunction,
    authSecretStorage: AuthSecretStorage,
    wordlist: string[],
  );
  logIn: (passphrase: string) => Promise<void>;
  signUp: (name?: string) => Promise<string>;
  registerNewAccount: (passphrase: string, name: string) => Promise<string>;
  getCurrentAccountPassphrase: () => Promise<string>;
  generateRandomPassphrase: () => string;
  loadCurrentAccountPassphrase: () => Promise<void>;
  listeners: Set<() => void>;
  subscribe: (callback: () => void) => () => void;
  notify(): void;
}
