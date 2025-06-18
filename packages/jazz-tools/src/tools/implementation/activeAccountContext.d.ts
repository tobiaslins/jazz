import type { Account } from "../internal.js";
declare class ActiveAccountContext {
  private activeAccount;
  private guestMode;
  set(account: Account | null): void;
  setGuestMode(): void;
  maybeGet(): Account | null;
  get(): Account;
}
export type { ActiveAccountContext };
export declare const activeAccountContext: ActiveAccountContext;
