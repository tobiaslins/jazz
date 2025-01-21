import { AgentSecret } from "cojson";
import { Account, ID } from "jazz-tools";

const STORAGE_KEY = "jazz-logged-in-secret";

export type AuthCredentials = {
  accountID: ID<Account>;
  secretSeed?: Uint8Array;
  accountSecret: AgentSecret;
  provider?: "anonymous" | "clerk" | "demo" | "passkey" | "passphrase" | string;
};

export type AuthSetPayload = {
  accountID: ID<Account>;
  secretSeed?: Uint8Array;
  accountSecret: AgentSecret;
  provider: "anonymous" | "clerk" | "demo" | "passkey" | "passphrase" | string;
};

export const AuthSecretStorage = {
  migrate() {
    if (!localStorage[STORAGE_KEY]) {
      const demoAuthSecret = localStorage["demo-auth-logged-in-secret"];
      if (demoAuthSecret) {
        localStorage[STORAGE_KEY] = demoAuthSecret;
        delete localStorage["demo-auth-logged-in-secret"];
      }

      const clerkAuthSecret = localStorage["jazz-clerk-auth"];
      if (clerkAuthSecret) {
        localStorage[STORAGE_KEY] = clerkAuthSecret;
        delete localStorage["jazz-clerk-auth"];
      }
    }
  },

  get(): AuthCredentials | null {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return null;

    const parsed = JSON.parse(data);

    if (!parsed.accountID || !parsed.accountSecret) {
      throw new Error("Invalid auth secret storage data");
    }

    return {
      accountID: parsed.accountID,
      secretSeed: parsed.secretSeed
        ? new Uint8Array(parsed.secretSeed)
        : undefined,
      accountSecret: parsed.accountSecret,
      provider: parsed.provider,
    };
  },

  set(payload: AuthSetPayload) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        accountID: payload.accountID,
        secretSeed: payload.secretSeed
          ? Array.from(payload.secretSeed)
          : undefined,
        accountSecret: payload.accountSecret,
        provider: payload.provider,
      }),
    );
    this.emitUpdate();
  },

  isAnonymous() {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) return false;

    const parsed = JSON.parse(data);

    return parsed.provider === "anonymous";
  },

  onUpdate(handler: () => void) {
    window.addEventListener("jazz-auth-update", handler);
    return () => window.removeEventListener("jazz-auth-update", handler);
  },

  emitUpdate() {
    window.dispatchEvent(new Event("jazz-auth-update"));
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
    this.emitUpdate();
  },
};
