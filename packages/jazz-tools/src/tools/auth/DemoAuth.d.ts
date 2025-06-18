import { AuthenticateAccountFunction } from "../types.js";
import { AuthSecretStorage } from "./AuthSecretStorage.js";
/**
 * `DemoAuth` provides a `JazzAuth` object for demo authentication.
 *
 * Demo authentication is useful for quickly testing your app, as it allows you to create new accounts and log in as existing ones.
 *
 * ```
 * import { DemoAuth } from "jazz-tools";
 *
 * const auth = new DemoAuth(jazzContext.authenticate, new AuthSecretStorage());
 * ```
 *
 * @category Auth Providers
 */
export declare class DemoAuth {
  private authenticate;
  private authSecretStorage;
  constructor(
    authenticate: AuthenticateAccountFunction,
    authSecretStorage: AuthSecretStorage,
  );
  logIn: (username: string) => Promise<void>;
  signUp: (username: string) => Promise<void>;
  private addToExistingUsers;
  private getExisitingUsersWithData;
  getExistingUsers: () => Promise<string[]>;
}
export declare function encodeUsername(username: string): string;
