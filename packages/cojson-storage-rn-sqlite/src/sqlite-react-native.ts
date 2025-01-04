import { DB, open, openSync } from "@op-engineering/op-sqlite";

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
    db: DB,
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

          console.log(`#### Handing ${msg.action}`);
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
          console.error(e);
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

    return { ...storageAsPeer, priority: 90 };
  }

  static async open(
    filename: string,
    fromLocalNode: IncomingSyncStream,
    toLocalNode: OutgoingSyncQueue,
  ) {
    const db = open({
      name: filename,
    });
    const path = db.getDbPath();
    console.warn(path);

    await db.execute("PRAGMA journal_mode = WAL;"); // or OFF

    const oldVersion =
      Number((await db.execute("PRAGMA user_version")).rows[0]?.user_version) ??
      0;

    console.log("DB version", oldVersion);

    if (oldVersion === 0) {
      console.log("Migration 0 -> 1: Basic schema");
      await db.execute(
        `CREATE TABLE IF NOT EXISTS transactions (
                    ses INTEGER,
                    idx INTEGER,
                    tx TEXT NOT NULL,
                    PRIMARY KEY (ses, idx)
                ) WITHOUT ROWID;`,
      );

      await db.execute(
        `CREATE TABLE IF NOT EXISTS sessions (
                    rowID INTEGER PRIMARY KEY,
                    coValue INTEGER NOT NULL,
                    sessionID TEXT NOT NULL,
                    lastIdx INTEGER,
                    lastSignature TEXT,
                    UNIQUE (sessionID, coValue)
                );`,
      );

      await db.execute(
        `CREATE INDEX IF NOT EXISTS sessionsByCoValue ON sessions (coValue);`,
      );

      await db.execute(
        `CREATE TABLE IF NOT EXISTS coValues (
                    rowID INTEGER PRIMARY KEY,
                    id TEXT NOT NULL UNIQUE,
                    header TEXT NOT NULL UNIQUE
                );`,
      );

      await db.execute(
        `CREATE INDEX IF NOT EXISTS coValuesByID ON coValues (id);`,
      );

      await db.execute("PRAGMA user_version = 1");
      console.log("Migration 0 -> 1: Basic schema - done");
    }

    if (oldVersion <= 1) {
      // fix embarrassing off-by-one error for transaction indices
      console.log(
        "Migration 1 -> 2: Fix off-by-one error for transaction indices",
      );

      const { rows } = await db.execute("SELECT * FROM transactions");

      if (!rows) return;

      for (const tx of rows) {
        await db.execute(`DELETE FROM transactions WHERE ses = ? AND idx = ?`, [
          tx.ses!,
          tx.idx!,
        ]);
        tx.idx = Number(tx.idx) - 1;
        await db.execute(
          `INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)`,
          [tx.ses!, tx.idx!, tx.tx!],
        );
      }

      await db.execute("PRAGMA user_version = 2");
      console.log(
        "Migration 1 -> 2: Fix off-by-one error for transaction indices - done",
      );
    }

    console.log("oldVersion", oldVersion);
    if (oldVersion <= 2) {
      console.log("Migration 2 -> 3: Add signatureAfter");

      await db.execute(
        `CREATE TABLE IF NOT EXISTS signatureAfter (
                    ses INTEGER,
                    idx INTEGER,
                    signature TEXT NOT NULL,
                    PRIMARY KEY (ses, idx)
                ) WITHOUT ROWID;`,
      );

      await db.execute(
        `ALTER TABLE sessions ADD COLUMN bytesSinceLastSignature INTEGER;`,
      );

      await db.execute("PRAGMA user_version = 3");
      console.log("Migration 2 -> 3: Add signatureAfter - done!!");
    }

    return new SQLiteReactNative(db, fromLocalNode, toLocalNode);
  }
}
