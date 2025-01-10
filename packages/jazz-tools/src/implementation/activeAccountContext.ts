import type { Account } from "../coValues/account.js";

class ActiveAccountContext {
  private activeAccount: Account | null = null;
  private guestMode: boolean = false;

  set(account: Account) {
    this.activeAccount = account;
    this.guestMode = false;
  }

  setGuestMode() {
    this.guestMode = true;
  }

  get() {
    if (!this.activeAccount) {
      if (this.guestMode) {
        throw new Error(
          "The current active account is a guest account. You cannot access the account's data.",
        );
      }

      throw new Error("No active account");
    }

    return this.activeAccount;
  }
}

export type { ActiveAccountContext };

export const activeAccountContext = new ActiveAccountContext();
