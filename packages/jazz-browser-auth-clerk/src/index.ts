import { AgentSecret } from "cojson";
import { AuthSecretStorage, BrowserOnboardingAuth } from "jazz-browser";
import { Account, AuthMethod, AuthResult, Credentials, ID } from "jazz-tools";

export type MinimalClerkClient = {
  user:
    | {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unsafeMetadata: Record<string, any>;
        fullName: string | null;
        username: string | null;
        id: string;
        update: (args: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          unsafeMetadata: Record<string, any>;
        }) => Promise<unknown>;
      }
    | null
    | undefined;
  signOut: () => Promise<void>;
};

function saveCredentialsToLocalStorage(credentials: Credentials) {
  AuthSecretStorage.set({
    accountID: credentials.accountID,
    accountSecret: credentials.secret,
  });
}

export class BrowserClerkAuth implements AuthMethod {
  constructor(
    public driver: BrowserClerkAuth.Driver,
    private readonly clerkClient: MinimalClerkClient,
  ) {}

  async start(): Promise<AuthResult> {
    AuthSecretStorage.migrate();

    // Check local storage for credentials
    const credentials = AuthSecretStorage.get();

    if (credentials && !BrowserOnboardingAuth.isUserOnboarding()) {
      try {
        return {
          type: "existing",
          credentials: {
            accountID: credentials.accountID,
            secret: credentials.accountSecret,
          },
          saveCredentials: async () => {}, // No need to save credentials when recovering from local storage
          onSuccess: () => {},
          onError: (error: string | Error) => {
            this.driver.onError(error);
          },
          logOut: () => {
            AuthSecretStorage.clear();
            void this.clerkClient.signOut();
          },
        };
      } catch (e) {
        console.error("Error parsing local storage credentials", e);
      }
    }

    if (this.clerkClient.user) {
      const username =
        this.clerkClient.user.fullName ||
        this.clerkClient.user.username ||
        this.clerkClient.user.id;
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
            void this.clerkClient.signOut();
          },
        };
      } else if (BrowserOnboardingAuth.isUserOnboarding()) {
        const onboardingUserData =
          BrowserOnboardingAuth.getUserOnboardingData();

        return {
          type: "existing",
          username,
          credentials: {
            accountID: onboardingUserData.accountID,
            secret: onboardingUserData.secret,
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
            void this.clerkClient.signOut();
          },
        };
      } else {
        // No credentials found, so we need to create new credentials
        return {
          type: "new",
          creationProps: {
            name: username,
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
