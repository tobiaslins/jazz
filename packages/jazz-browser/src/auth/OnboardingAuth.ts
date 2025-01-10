import { AgentSecret, CryptoProvider } from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";
import { AuthSecretStorage } from "./AuthSecretStorage.js";

export type OnboardingStorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
  secretSeed: number[];
  onboarding: true;
};

/**
 * `BrowserOnboardingAuth` provides a `JazzAuth` object for demo authentication.
 *
 * Demo authentication is useful for quickly testing your app, as it allows you to create new accounts and log in as existing ones. The authentication persists across page reloads, with the credentials stored in `localStorage`.
 *
 * ```
 * import { BrowserOnboardingAuth } from "jazz-browser";
 *
 * const auth = new BrowserOnboardingAuth(driver);
 * ```
 *
 * @category Auth Providers
 */
export class BrowserOnboardingAuth implements AuthMethod {
  constructor(
    public defaultUserName: string,
    public driver: BrowserOnboardingAuth.Driver,
  ) {}

  /**
   * @returns A `JazzAuth` object
   */
  async start(crypto: CryptoProvider) {
    AuthSecretStorage.migrate();

    const existingUser = AuthSecretStorage.get();

    if (existingUser) {
      const accountID = existingUser.accountID;
      const secret = existingUser.accountSecret;

      return {
        type: "existing",
        credentials: { accountID, secret },
        onSuccess: () => {
          this.driver.onSignedIn({ logOut });
        },
        onError: (error: string | Error) => {
          this.driver.onError(error);
        },
        logOut,
      } satisfies AuthResult;
    } else {
      const secretSeed = crypto.newRandomSecretSeed();

      return {
        type: "new",
        creationProps: { name: this.defaultUserName, anonymous: true },
        initialSecret: crypto.agentSecretFromSecretSeed(secretSeed),
        saveCredentials: async (credentials: {
          accountID: ID<Account>;
          secret: AgentSecret;
        }) => {
          AuthSecretStorage.set({
            accountID: credentials.accountID,
            accountSecret: credentials.secret,
            secretSeed: Array.from(secretSeed),
            onboarding: true,
          } satisfies OnboardingStorageData);
        },
        onSuccess: () => {
          this.driver.onSignedIn({ logOut });
        },
        onError: (error: string | Error) => {
          this.driver.onError(error);
        },
        logOut,
      } satisfies AuthResult;
    }
  }

  static getUserOnboardingData() {
    const localStorageData = AuthSecretStorage.get() as OnboardingStorageData;

    if (
      !localStorageData?.secretSeed ||
      !localStorageData?.accountID ||
      !localStorageData?.accountSecret ||
      !localStorageData?.onboarding
    ) {
      throw new Error("No onboarding user found");
    }

    return {
      accountID: localStorageData.accountID,
      secret: localStorageData.accountSecret,
      secretSeed: new Uint8Array(localStorageData.secretSeed),
    };
  }

  static onUpdate(handler: () => void) {
    window.addEventListener("onboarding-auth-update", handler);
    return () => window.removeEventListener("onboarding-auth-update", handler);
  }

  static emitUpdate() {
    window.dispatchEvent(new Event("onboarding-auth-update"));
  }

  static isUserOnboarding() {
    const existingUser = AuthSecretStorage.get() as OnboardingStorageData;

    return existingUser && existingUser.onboarding;
  }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace BrowserOnboardingAuth {
  export interface Driver {
    onSignedIn: (next: { logOut: () => void }) => void;
    onError: (error: string | Error) => void;
  }
}

function logOut() {
  AuthSecretStorage.clear();
}
