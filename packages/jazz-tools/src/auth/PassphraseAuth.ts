import * as bip39 from "@scure/bip39";
import { entropyToMnemonic } from "@scure/bip39";
import { generateMnemonic } from "@scure/bip39";
import { CryptoProvider, cojsonInternals } from "cojson";
import { Account } from "../coValues/account.js";
import type { ID } from "../internal.js";
import type {
  AuthenticateAccountFunction,
  RegisterAccountFunction,
} from "../types.js";
import { AuthSecretStorage } from "./AuthSecretStorage.js";

/**
 * `PassphraseAuth` provides a `JazzAuth` object for passphrase authentication.
 *
 * ```ts
 * import { PassphraseAuth } from "jazz-tools";
 *
 * const auth = new PassphraseAuth(crypto, jazzContext.authenticate, jazzContext.register, new AuthSecretStorage(), wordlist);
 * ```
 *
 * @category Auth Providers
 */
export class PassphraseAuth {
  constructor(
    private crypto: CryptoProvider,
    private authenticate: AuthenticateAccountFunction,
    private register: RegisterAccountFunction,
    private authSecretStorage: AuthSecretStorage,
    public wordlist: string[],
  ) {}

  logIn = async (passphrase: string) => {
    const { crypto, authenticate } = this;

    let secretSeed;

    try {
      secretSeed = bip39.mnemonicToEntropy(passphrase, this.wordlist);
    } catch (e) {
      throw new Error("Invalid passphrase");
    }

    const accountSecret = crypto.agentSecretFromSecretSeed(secretSeed);

    const accountID = cojsonInternals.idforHeader(
      cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret, crypto),
      crypto,
    ) as ID<Account>;

    await authenticate({
      accountID,
      accountSecret,
    });

    await this.authSecretStorage.set({
      accountID,
      secretSeed,
      accountSecret,
      provider: "passphrase",
    });
  };

  signUp = async (username: string, passphrase: string) => {
    const { crypto, register } = this;

    let secretSeed;

    try {
      secretSeed = bip39.mnemonicToEntropy(passphrase, this.wordlist);
    } catch (e) {
      throw new Error("Invalid passphrase");
    }

    const accountSecret = crypto.agentSecretFromSecretSeed(secretSeed);

    const accountID = await register(accountSecret, { name: username });

    await this.authSecretStorage.set({
      accountID,
      secretSeed,
      accountSecret,
      provider: "passphrase",
    });

    const currentAccount = await Account.getMe().ensureLoaded({
      profile: {},
    });

    if (currentAccount) {
      currentAccount.profile.name = username;
    }
  };

  generateRandomPassphrase = () => {
    return generateMnemonic(
      this.wordlist,
      cojsonInternals.secretSeedLength * 8,
    );
  };

  getCurrentUserPassphrase = async () => {
    const credentials = await this.authSecretStorage.get();

    if (!credentials || !credentials.secretSeed) {
      throw new Error("No credentials found");
    }

    return entropyToMnemonic(credentials.secretSeed, this.wordlist);
  };
}
