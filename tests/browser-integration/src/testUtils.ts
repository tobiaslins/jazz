import { commands } from "@vitest/browser/context";
import { StorageManagerAsync } from "cojson-storage";
import { internal_setDatabaseName } from "cojson-storage-indexeddb";
import {
  Account,
  AccountClass,
  AnyAccountSchema,
  CoValueFromRaw,
  JazzContextManagerAuthProps,
  SyncMessage,
  cojsonInternals,
} from "jazz-tools";
import {
  JazzBrowserContextManager,
  JazzContextManagerProps,
} from "jazz-tools/browser";
import { onTestFinished } from "vitest";

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

export async function createAccountContext<
  Acc extends
    | (AccountClass<Account> & CoValueFromRaw<Account>)
    | AnyAccountSchema,
>(
  props: JazzContextManagerProps<Acc> & { databaseName?: string },
  authProps?: JazzContextManagerAuthProps,
) {
  internal_setDatabaseName(
    props.databaseName ?? Math.random().toString(36).substring(2, 15),
  );

  const contextManager = new JazzBrowserContextManager<Acc>();

  await contextManager.createContext(props, authProps);

  const value = contextManager.getCurrentValue();

  if (!value || !("me" in value)) {
    throw new Error("Account not found");
  }

  onTestFinished(async () => {
    contextManager.done();
  });

  return { context: value, account: value.me, contextManager };
}

export async function startSyncServer(port?: number, dbName?: string) {
  const { url, port: syncServerPort } = await commands.startSyncServer(
    port,
    dbName,
  );

  function close() {
    return commands.closeSyncServer(url);
  }

  onTestFinished(close);

  return {
    url,
    port: syncServerPort,
    disconnectAllClients: () => commands.disconnectAllClients(url),
    setOffline: (active: boolean) => commands.setOffline(url, active),
    close,
  };
}

const { SyncManager } = cojsonInternals;

export function trackMessages() {
  const messages: {
    from: "client" | "server" | "storage";
    msg: SyncMessage;
  }[] = [];

  const originalHandleSyncMessage =
    StorageManagerAsync.prototype.handleSyncMessage;
  const originalNodeSyncMessage = SyncManager.prototype.handleSyncMessage;

  StorageManagerAsync.prototype.handleSyncMessage = async function (msg: any) {
    messages.push({
      from: "client",
      msg,
    });
    return originalHandleSyncMessage.call(this, msg);
  };

  SyncManager.prototype.handleSyncMessage = async function (msg, peer) {
    messages.push({
      from: peer.role,
      msg,
    });
    return originalNodeSyncMessage.call(this, msg, peer);
  };

  const restore = () => {
    StorageManagerAsync.prototype.handleSyncMessage = originalHandleSyncMessage;
    SyncManager.prototype.handleSyncMessage = originalNodeSyncMessage;
    messages.length = 0;
  };

  const clear = () => {
    messages.length = 0;
  };

  onTestFinished(() => {
    restore();
  });

  return {
    messages,
    restore,
    clear,
  };
}
