import { AgentSecret } from "cojson";
import { Account } from "../coValues/account.js";
import { ID } from "../internal.js";
import { AuthenticateAccountFunction } from "../types.js";
import { AuthSecretStorage } from "./AuthSecretStorage.js";
import { KvStoreContext } from "./KvStoreContext.js";

type StorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
  secretSeed?: number[];
};

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
export class DemoAuth {
  constructor(
    private authenticate: AuthenticateAccountFunction,
    private authSecretStorage: AuthSecretStorage,
  ) {}

  logIn = async (username: string) => {
    const kvStore = KvStoreContext.getInstance().getStorage();

    const storageData = JSON.parse(
      (await kvStore.get("demo-auth-existing-users-" + username)) ?? "{}",
    ) as StorageData;

    if (!storageData.accountID) {
      throw new Error("User not found");
    }

    await this.authenticate({
      accountID: storageData.accountID,
      accountSecret: storageData.accountSecret,
    });

    await this.authSecretStorage.set({
      accountID: storageData.accountID,
      accountSecret: storageData.accountSecret,
      secretSeed: storageData.secretSeed
        ? new Uint8Array(storageData.secretSeed)
        : undefined,
      provider: "demo",
    });
  };

  signUp = async (username: string) => {
    const existingUsers = await this.getExistingUsers();
    if (existingUsers.includes(username)) {
      throw new Error("User already registered");
    }

    const credentials = await this.authSecretStorage.get();

    if (!credentials) {
      throw new Error("No credentials found");
    }

    const currentAccount = await Account.getMe().ensureLoaded({
      profile: {},
    });

    if (currentAccount) {
      currentAccount.profile.name = username;
    }

    await this.authSecretStorage.set({
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
  };

  private async addToExistingUsers(username: string, data: StorageData) {
    const kvStore = KvStoreContext.getInstance().getStorage();
    await kvStore.set(
      "demo-auth-existing-users-" + username,
      JSON.stringify(data),
    );

    const existingUsers = await this.getExistingUsers();
    await kvStore.set(
      "demo-auth-existing-users",
      existingUsers.join(",") + "," + username,
    );
  }

  getExistingUsers = async () => {
    const kvStore = KvStoreContext.getInstance().getStorage();
    const existingUsers = await kvStore.get("demo-auth-existing-users");
    return existingUsers ? existingUsers.split(",") : [];
  };
}
