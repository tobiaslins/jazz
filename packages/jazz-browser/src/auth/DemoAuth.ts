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
      const storageData = JSON.stringify(credentials satisfies StorageData);
      if (
        !(
          localStorage["demo-auth-existing-users"]?.split(",") as
            | string[]
            | undefined
        )?.includes(name)
      ) {
        localStorage["demo-auth-existing-users"] = localStorage[
          "demo-auth-existing-users"
        ]
          ? localStorage["demo-auth-existing-users"] + "," + name
          : name;
      }
      localStorage["demo-auth-existing-users-" + name] = storageData;
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

  signUp(username: string) {
    const credentials = AuthSecretStorage.get();

    if (!credentials) {
      throw new Error("User already registered");
    }

    const storageData = JSON.stringify({
      accountID: credentials.accountID,
      accountSecret: credentials.accountSecret,
      secretSeed: credentials.secretSeed
        ? Array.from(credentials.secretSeed)
        : undefined,
    } satisfies StorageData);

    localStorage["demo-auth-existing-users-" + username] = storageData;
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
