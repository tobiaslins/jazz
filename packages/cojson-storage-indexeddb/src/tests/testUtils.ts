import type { LocalNode, SyncMessage } from "cojson";
import { cojsonInternals } from "cojson";
import { StorageManagerAsync } from "cojson-storage";
import { onTestFinished } from "vitest";

const { SyncManager } = cojsonInternals;

export function trackMessages() {
  const messages: {
    from: "client" | "server" | "storage";
    msg: SyncMessage;
  }[] = [];

  const originalHandleSyncMessage =
    StorageManagerAsync.prototype.handleSyncMessage;
  const originalNodeSyncMessage = SyncManager.prototype.handleSyncMessage;

  StorageManagerAsync.prototype.handleSyncMessage = async function (msg) {
    messages.push({
      from: "client",
      msg,
    });
    return originalHandleSyncMessage.call(this, msg);
  };

  SyncManager.prototype.handleSyncMessage = async function (msg, peer) {
    messages.push({
      from: "storage",
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

export function waitFor(
  callback: () => boolean | undefined | Promise<boolean | undefined>,
) {
  return new Promise<void>((resolve, reject) => {
    const checkPassed = async () => {
      try {
        return { ok: await callback(), error: null };
      } catch (error) {
        return { ok: false, error };
      }
    };

    let retries = 0;

    const interval = setInterval(async () => {
      const { ok, error } = await checkPassed();

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
