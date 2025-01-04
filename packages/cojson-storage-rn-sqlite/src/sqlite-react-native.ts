import {
  NitroSQLite,
  type NitroSQLiteConnection,
  open,
} from "react-native-nitro-sqlite";

import {
  type IncomingSyncStream,
  type OutgoingSyncQueue,
  type Peer,
  cojsonInternals,
} from "cojson";
import { SyncManager, type TransactionRow } from "cojson-storage";
import { SQLiteClient } from "./client.js";

export class SQLiteReactNative {
  private readonly syncManager: SyncManager;
  private readonly dbClient: SQLiteClient;

  constructor(
    db: NitroSQLiteConnection,
    fromLocalNode: IncomingSyncStream,
    toLocalNode: OutgoingSyncQueue,
  ) {
    console.log("SQLiteReactNative constructor");
    this.dbClient = new SQLiteClient(db, toLocalNode);
    this.syncManager = new SyncManager(this.dbClient, toLocalNode);

    const processMessages = async () => {
      let lastTimer = performance.now();

      for await (const msg of fromLocalNode) {
        try {
          if (msg === "Disconnected" || msg === "PingTimeout") {
            throw new Error("Unexpected Disconnected message");
          }
          await this.syncManager.handleSyncMessage(msg);

          // Since better-sqlite3 is synchronous there may be the case
          // where a bulk of messages are processed using only microtasks
          // which may block other peers from sending messages.

          // To avoid this we schedule a timer to downgrade the priority of the storage peer work
          if (performance.now() - lastTimer > 500) {
            lastTimer = performance.now();
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
        } catch (e) {
          console.error(
            new Error(
              `Error reading from localNode, handling msg\n\n${JSON.stringify(
                msg,
                (k, v) =>
                  k === "changes" || k === "encryptedChanges"
                    ? `${v.slice(0, 20)}...`
                    : v,
              )}`,
              { cause: e },
            ),
          );
        }
      }
    };

    processMessages().catch((e) =>
      console.error("Error in processMessages in sqlite", e),
    );
  }

  static async asPeer({
    filename,
    trace,
    localNodeName = "local",
  }: {
    filename: string;
    trace?: boolean;
    localNodeName?: string;
  }): Promise<Peer> {
    const [localNodeAsPeer, storageAsPeer] = cojsonInternals.connectedPeers(
      localNodeName,
      "storage",
      { peer1role: "client", peer2role: "storage", trace, crashOnClose: true },
    );

    await SQLiteReactNative.open(
      filename,
      localNodeAsPeer.incoming,
      localNodeAsPeer.outgoing,
    );

    return { ...storageAsPeer, priority: 100 };
  }

  static async open(
    filename: string,
    fromLocalNode: IncomingSyncStream,
    toLocalNode: OutgoingSyncQueue,
  ) {
    const db = open({
      name: filename,
    });

    await db.executeAsync("PRAGMA journal_mode = WAL;"); // or OFF

    const oldVersion =
      Number(
        (await db.executeAsync("PRAGMA user_version")).rows?._array[0]
          ?.user_version,
      ) ?? 0;

    console.log("DB version", oldVersion);

    if (oldVersion === 0) {
      console.log("Migration 0 -> 1: Basic schema");
      db.executeAsync(
        `CREATE TABLE IF NOT EXISTS transactions (
                    ses INTEGER,
                    idx INTEGER,
                    tx TEXT NOT NULL,
                    PRIMARY KEY (ses, idx)
                ) WITHOUT ROWID;`,
      );

      db.executeAsync(
        `CREATE TABLE IF NOT EXISTS sessions (
                    rowID INTEGER PRIMARY KEY,
                    coValue INTEGER NOT NULL,
                    sessionID TEXT NOT NULL,
                    lastIdx INTEGER,
                    lastSignature TEXT,
                    UNIQUE (sessionID, coValue)
                );`,
      );

      // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
      db.executeAsync(
        `CREATE INDEX IF NOT EXISTS sessionsByCoValue ON sessions (coValue);`,
      );

      db.executeAsync(
        `CREATE TABLE IF NOT EXISTS coValues (
                    rowID INTEGER PRIMARY KEY,
                    id TEXT NOT NULL UNIQUE,
                    header TEXT NOT NULL UNIQUE
                );`,
      );

      // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
      db.executeAsync(
        `CREATE INDEX IF NOT EXISTS coValuesByID ON coValues (id);`,
      );

      db.executeAsync("PRAGMA user_version = 1");
      console.log("Migration 0 -> 1: Basic schema - done");
    }

    if (oldVersion <= 1) {
      // fix embarrassing off-by-one error for transaction indices
      console.log(
        "Migration 1 -> 2: Fix off-by-one error for transaction indices",
      );

      // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
      const { rows } = await db.executeAsync("SELECT * FROM transactions");

      if (!rows) return;

      for (const tx of rows._array) {
        // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
        db.executeAsync(`DELETE FROM transactions WHERE ses = ? AND idx = ?`, [
          tx.ses,
          tx.idx,
        ]);
        tx.idx = Number(tx.idx) - 1;
        // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
        db.executeAsync(
          `INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)`,
          [tx.ses, tx.idx, tx.tx],
        );
      }

      db.executeAsync("PRAGMA user_version = 2");
      console.log(
        "Migration 1 -> 2: Fix off-by-one error for transaction indices - done",
      );
    }

    if (oldVersion <= 2) {
      console.log("Migration 2 -> 3: Add signatureAfter");

      db.executeAsync(
        `CREATE TABLE IF NOT EXISTS signatureAfter (
                    ses INTEGER,
                    idx INTEGER,
                    signature TEXT NOT NULL,
                    PRIMARY KEY (ses, idx)
                ) WITHOUT ROWID;`,
      );

      // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
      db.executeAsync(
        `ALTER TABLE sessions ADD COLUMN bytesSinceLastSignature INTEGER;`,
      );

      db.executeAsync("PRAGMA user_version = 3");
      console.log("Migration 2 -> 3: Add signatureAfter - done!!");
    }

    return new SQLiteReactNative(db, fromLocalNode, toLocalNode);
  }
}
