import {
  JazzBrowserContextManager,
  JazzContextManagerProps,
} from "jazz-browser";
import { Account, JazzContextManagerAuthProps } from "jazz-tools";

export function waitFor(callback: () => boolean | void) {
  return new Promise<void>((resolve, reject) => {
    const checkPassed = () => {
      try {
        return { ok: callback(), error: null };
      } catch (error) {
        return { ok: false, error };
      }
    };

    let retries = 0;

    const interval = setInterval(() => {
      const { ok, error } = checkPassed();

      if (ok !== false) {
        clearInterval(interval);
        resolve();
      }

      if (++retries > 10) {
        clearInterval(interval);
        reject(error);
      }
    }, 100);
  });
}

export function getSyncServerUrl() {
  return globalThis.SYNC_SERVER_URL;
}

export async function createAccountContext<Acc extends Account>(
  props: JazzContextManagerProps<Acc>,
  authProps?: JazzContextManagerAuthProps,
) {
  const contextManager = new JazzBrowserContextManager<Acc>();

  await contextManager.createContext(props, authProps);

  const value = contextManager.getCurrentValue();

  if (!value || !("me" in value)) {
    throw new Error("Account not found");
  }

  return { context: value, account: value.me, contextManager };
}
