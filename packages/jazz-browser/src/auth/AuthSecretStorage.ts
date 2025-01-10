import { AgentSecret } from "cojson";
import { Account, ID } from "jazz-tools";

const STORAGE_KEY = "jazz-logged-in-secret";

export type AuthSecretStorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
};

export type OnboardingStorageData = {
  accountID: ID<Account>;
  accountSecret: AgentSecret;
  secretSeed: number[];
  onboarding: true;
};

export class AuthSecretStorage {
  static migrate() {
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
  }

  static get(): OnboardingStorageData | AuthSecretStorageData | null {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  }

  static isLoggedIn(): boolean {
    return !!this.get();
  }

  static set(data: OnboardingStorageData | AuthSecretStorageData) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static clear() {
    localStorage.removeItem(STORAGE_KEY);
  }
}
