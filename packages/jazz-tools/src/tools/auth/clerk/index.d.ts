import { AuthSecretStorage, AuthenticateAccountFunction } from "jazz-tools";
import {
  ClerkCredentials,
  MinimalClerkClient,
  isClerkCredentials,
} from "./types.js";
export type { MinimalClerkClient };
export { isClerkCredentials };
export declare class JazzClerkAuth {
  private authenticate;
  private authSecretStorage;
  constructor(
    authenticate: AuthenticateAccountFunction,
    authSecretStorage: AuthSecretStorage,
  );
  /**
   * Loads the Jazz auth data from the Clerk user and sets it in the auth secret storage.
   */
  static loadClerkAuthData(
    credentials: ClerkCredentials,
    storage: AuthSecretStorage,
  ): Promise<void>;
  static initializeAuth(clerk: MinimalClerkClient): Promise<void>;
  private isFirstCall;
  registerListener(clerkClient: MinimalClerkClient): void;
  onClerkUserChange: (
    clerkClient: Pick<MinimalClerkClient, "user">,
  ) => Promise<void>;
  logIn: (clerkClient: Pick<MinimalClerkClient, "user">) => Promise<void>;
  signIn: (clerkClient: Pick<MinimalClerkClient, "user">) => Promise<void>;
}
export declare namespace BrowserClerkAuth {
  interface Driver {
    onError: (error: string | Error) => void;
  }
}
