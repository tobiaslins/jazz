import type { Clerk } from "@clerk/clerk-js";
import { AgentSecret } from "cojson";
import { Account, AuthMethod, AuthResult, Credentials, ID } from "jazz-tools";

const localStorageKey = "jazz-clerk-auth";

function saveCredentialsToLocalStorage(credentials: Credentials) {
  localStorage.setItem(
    localStorageKey,
    JSON.stringify({
      accountID: credentials.accountID,
      secret: credentials.secret,
    }),
  );
}

function clearStoredCredentials() {
  localStorage.removeItem(localStorageKey);
}

export class BrowserClerkAuth implements AuthMethod {
  constructor(
    public driver: BrowserClerkAuth.Driver,
    private readonly clerkClient: Clerk,
  ) {}

  async start(): Promise<AuthResult> {
    // clear localStorage if the current Clerk user doesn't match stored credentials
    let locallyStoredCredentials = localStorage.getItem(localStorageKey);
    if (locallyStoredCredentials && this.clerkClient.user) {
      try {
        const stored = JSON.parse(locallyStoredCredentials);
        const clerkMetadata = this.clerkClient.user.unsafeMetadata;
        if (clerkMetadata.jazzAccountID !== stored.accountID) {
          clearStoredCredentials();
        }
      } catch (e) {
        clearStoredCredentials();
      }
    }

    // Check local storage for credentials
    locallyStoredCredentials = localStorage.getItem(localStorageKey);

    if (locallyStoredCredentials) {
      try {
        const credentials = JSON.parse(locallyStoredCredentials) as Credentials;
        return {
          type: "existing",
          credentials,
          saveCredentials: async () => {}, // No need to save credentials when recovering from local storage
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            clearStoredCredentials();
            void this.clerkClient.signOut();
          },
        };
      } catch (e) {
        console.error("Error parsing local storage credentials", e);
      }
    }

    if (this.clerkClient.user) {
      // Check clerk user metadata for credentials
      const storedCredentials = this.clerkClient.user.unsafeMetadata;
      if (storedCredentials.jazzAccountID) {
        if (!storedCredentials.jazzAccountSecret) {
          throw new Error("No secret for existing user");
        }
        return {
          type: "existing",
          credentials: {
            accountID: storedCredentials.jazzAccountID as ID<Account>,
            secret: storedCredentials.jazzAccountSecret as AgentSecret,
          },
          saveCredentials: async ({ accountID, secret }: Credentials) => {
            saveCredentialsToLocalStorage({
              accountID,
              secret,
            });
          },
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            clearStoredCredentials();
            void this.clerkClient.signOut();
          },
        };
      } else {
        // No credentials found, so we need to create new credentials
        return {
          type: "new",
          creationProps: {
            name:
              this.clerkClient.user.fullName ||
              this.clerkClient.user.firstName ||
              this.clerkClient.user.username ||
              this.clerkClient.user.primaryEmailAddress?.emailAddress?.split(
                "@",
              )[0] ||
              this.clerkClient.user.id,
          },
          saveCredentials: async ({ accountID, secret }: Credentials) => {
            saveCredentialsToLocalStorage({
              accountID,
              secret,
            });
            await this.clerkClient.user?.update({
              unsafeMetadata: {
                jazzAccountID: accountID,
                jazzAccountSecret: secret,
              },
            });
          },
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            clearStoredCredentials();
            void this.clerkClient.signOut();
          },
        };
      }
    } else {
      // Clerk user not found, so we can't authenticate
      throw new Error("Not signed in");
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserClerkAuth {
  export interface Driver {
    onError: (error: string | Error) => void;
  }
}
