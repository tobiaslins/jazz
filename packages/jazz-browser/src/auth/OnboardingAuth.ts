import { AgentSecret, CryptoProvider } from "cojson";
import { Account, AuthMethod, AuthResult, ID } from "jazz-tools";

export type OnboardingStorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
  secretSeed: number[];
  onboarding: true;
};

const STORAGE_KEY = "jazz-logged-in-secret";

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
    const existingUser = localStorage[STORAGE_KEY];

    if (existingUser) {
      const existingUserData = JSON.parse(
        existingUser,
      ) as OnboardingStorageData;

      const accountID = existingUserData.accountID as ID<Account>;
      const secret = existingUserData.accountSecret;

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
          const storageData = JSON.stringify({
            accountID: credentials.accountID,
            accountSecret: credentials.secret,
            secretSeed: Array.from(secretSeed),
            onboarding: true,
          } satisfies OnboardingStorageData);

          localStorage[STORAGE_KEY] = storageData;
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
    const localStorageData = JSON.parse(
      localStorage[STORAGE_KEY] ?? null,
    ) as OnboardingStorageData;

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

  static isUserOnboarding() {
    const existingUser = localStorage[STORAGE_KEY];

    return existingUser && JSON.parse(existingUser).onboarding;
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
  delete localStorage[STORAGE_KEY];
}
