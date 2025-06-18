import { CryptoProvider } from "cojson";
import { AuthSecretStorage, AuthenticateAccountFunction } from "jazz-tools";
/**
 * `BrowserPasskeyAuth` provides a `JazzAuth` object for passkey authentication.
 *
 * ```ts
 * import { BrowserPasskeyAuth } from "jazz-tools/browser";
 *
 * const auth = new BrowserPasskeyAuth(driver, appName);
 * ```
 *
 * @category Auth Providers
 */
export declare class BrowserPasskeyAuth {
  protected crypto: CryptoProvider;
  protected authenticate: AuthenticateAccountFunction;
  protected authSecretStorage: AuthSecretStorage;
  appName: string;
  appHostname: string;
  constructor(
    crypto: CryptoProvider,
    authenticate: AuthenticateAccountFunction,
    authSecretStorage: AuthSecretStorage,
    appName: string,
    appHostname?: string,
  );
  static readonly id = "passkey";
  logIn: () => Promise<void>;
  signUp: (username: string) => Promise<void>;
  private createPasskeyCredentials;
  private getPasskeyCredentials;
}
