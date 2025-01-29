import {
  Account,
  AnonymousJazzAgent,
  AuthSecretStorage,
  InMemoryKVStore,
  KvStoreContext
} from "jazz-tools";
import { JAZZ_AUTH_CTX, JAZZ_CTX, type JazzContext } from './jazz.svelte.js';
import { getJazzContextShape } from "jazz-tools/testing";

export function createJazzTestContext<Acc extends Account>(opts: {
  account?: Acc | { guest: AnonymousJazzAgent };
} = {}) {
  const ctx = new Map<typeof JAZZ_CTX | typeof JAZZ_AUTH_CTX, JazzContext<Acc> | AuthSecretStorage>();
  const account = opts.account ?? Account.getMe() as Acc;

  const value = getJazzContextShape(account);
  const authSecretStorage = new AuthSecretStorage();

  KvStoreContext.getInstance().initialize(new InMemoryKVStore());

  ctx.set(JAZZ_AUTH_CTX, authSecretStorage);

  if ('guest' in account) {
    ctx.set(JAZZ_CTX, {
      current: value
    });
  } else {
    ctx.set(JAZZ_CTX, {
      current: value
    });
  } 

  return ctx;
}

export {
  createJazzTestAccount,
  createJazzTestGuest,
  linkAccounts,
  setActiveAccount,
  setupJazzTestSync,
} from "jazz-tools/testing";
