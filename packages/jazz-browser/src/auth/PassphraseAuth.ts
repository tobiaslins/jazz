import * as bip39 from "@scure/bip39";
import { entropyToMnemonic } from "@scure/bip39";
import { generateMnemonic } from "@scure/bip39";
import { CryptoProvider, cojsonInternals } from "cojson";
import {
  Account,
  AuthenticateAccountFunction,
  ID,
  RegisterAccountFunction,
} from "jazz-tools";
import { AuthSecretStorage } from "./AuthSecretStorage.js";

/**
 * `BrowserPassphraseAuth` provides a `JazzAuth` object for passphrase authentication.
 *
 * ```ts
 * import { BrowserPassphraseAuth } from "jazz-browser";
 *
 * const auth = new BrowserPassphraseAuth(driver, wordlist);
 * ```
 *
 * @category Auth Providers
 */
export class BrowserPassphraseAuth {
  constructor(
    private crypto: CryptoProvider,
    private authenticate: AuthenticateAccountFunction,
    private register: RegisterAccountFunction,
    public wordlist: string[],
  ) {}

  logIn = async (passphrase: string) => {
    const { crypto, authenticate } = this;

    const secretSeed = bip39.mnemonicToEntropy(passphrase, this.wordlist);
    const accountSecret = crypto.agentSecretFromSecretSeed(secretSeed);

    if (!accountSecret) {
      throw new Error("Invalid passphrase");
    }

    const accountID = cojsonInternals.idforHeader(
      cojsonInternals.accountHeaderForInitialAgentSecret(accountSecret, crypto),
      crypto,
    ) as ID<Account>;

    await authenticate({
      accountID,
      accountSecret,
    });

    AuthSecretStorage.set({
      accountID,
      secretSeed,
      accountSecret,
      provider: "passphrase",
    });
  };

  signUp = async (username: string, passphrase: string) => {
    const { crypto, register } = this;

    const secretSeed = bip39.mnemonicToEntropy(passphrase, this.wordlist);
    const accountSecret = crypto.agentSecretFromSecretSeed(secretSeed);

    if (!accountSecret) {
      throw new Error("Invalid passphrase");
    }

    const accountID = await register(accountSecret, { name: username });

    AuthSecretStorage.set({
      accountID,
      secretSeed,
      accountSecret,
      provider: "passphrase",
    });
  };

  generateRandomPassphrase = () => {
    return generateMnemonic(
      this.wordlist,
      cojsonInternals.secretSeedLength * 8,
    );
  };

  getCurrentUserPassphrase = () => {
    const credentials = AuthSecretStorage.get();

    if (!credentials || !credentials.secretSeed) {
      return null;
    }

    return entropyToMnemonic(credentials.secretSeed, this.wordlist);
  };
}
