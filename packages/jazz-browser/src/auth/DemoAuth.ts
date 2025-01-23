import { AgentSecret } from "cojson";
import { Account, AuthenticateAccountFunction, ID } from "jazz-tools";
import { AuthSecretStorage } from "./AuthSecretStorage.js";

type StorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
  secretSeed?: number[];
};

/**
 * `BrowserDemoAuth` provides a `JazzAuth` object for demo authentication.
 *
 * Demo authentication is useful for quickly testing your app, as it allows you to create new accounts and log in as existing ones. The authentication persists across page reloads, with the credentials stored in `localStorage`.
 *
 * ```
 * import { BrowserDemoAuth } from "jazz-browser";
 *
 * const auth = new BrowserDemoAuth(driver);
 * ```
 *
 * @category Auth Providers
 */
export class BrowserDemoAuth {
  constructor(
    private authenticate: AuthenticateAccountFunction,
    seedAccounts?: {
      [name: string]: {
        accountID: ID<Account>;
        accountSecret: AgentSecret;
      };
    },
  ) {
    for (const [name, credentials] of Object.entries(seedAccounts || {})) {
      if (!this.getExistingUsers().includes(name)) {
        this.addToExistingUsers(name, credentials);
      }
    }
  }

  logIn(username: string) {
    const storageData = JSON.parse(
      localStorage["demo-auth-existing-users-" + username],
    ) as StorageData;

    if (!storageData) {
      throw new Error("User not found");
    }

    this.authenticate({
      accountID: storageData.accountID,
      accountSecret: storageData.accountSecret,
    });

    AuthSecretStorage.set({
      accountID: storageData.accountID,
      accountSecret: storageData.accountSecret,
      secretSeed: storageData.secretSeed
        ? new Uint8Array(storageData.secretSeed)
        : undefined,
      provider: "demo",
    });
  }

  async signUp(username: string) {
    if (this.getExistingUsers().includes(username)) {
      throw new Error("User already registered");
    }

    const credentials = AuthSecretStorage.get();

    if (!credentials) {
      throw new Error("No credentials found");
    }

    AuthSecretStorage.set({
      accountID: credentials.accountID,
      accountSecret: credentials.accountSecret,
      secretSeed: credentials.secretSeed
        ? new Uint8Array(credentials.secretSeed)
        : undefined,
      provider: "demo",
    });

    this.addToExistingUsers(username, {
      accountID: credentials.accountID,
      accountSecret: credentials.accountSecret,
      secretSeed: credentials.secretSeed
        ? Array.from(credentials.secretSeed)
        : undefined,
    });

    const currentAccount = await Account.getMe().ensureLoaded({
      profile: {},
    });

    if (currentAccount) {
      currentAccount.profile.name = username;
    }
  }

  private addToExistingUsers(username: string, data: StorageData) {
    localStorage["demo-auth-existing-users-" + username] = JSON.stringify(data);
    localStorage["demo-auth-existing-users"] = localStorage[
      "demo-auth-existing-users"
    ]
      ? localStorage["demo-auth-existing-users"] + "," + username
      : username;
  }

  getExistingUsers() {
    return (
      (localStorage["demo-auth-existing-users"]
        ?.split(",")
        .filter((user: string) => user !== "") as string[]) ?? []
    );
  }
}
