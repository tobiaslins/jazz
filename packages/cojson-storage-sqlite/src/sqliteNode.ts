import type { Peer } from "cojson";
import {
  SQLiteClient,
  SQLiteNodeBase,
  StorageApiSync,
  getSQLiteMigrationQueries,
} from "cojson-storage";
import { BetterSqliteDriver } from "./betterSqliteDriver.js";
export class SQLiteNode extends SQLiteNodeBase {
  static async asPeer({
    filename,
    localNodeName = "local",
  }: {
    filename: string;
    localNodeName?: string;
  }): Promise<Peer> {
    const db = new BetterSqliteDriver(filename);

    return SQLiteNodeBase.create({
      db,
      localNodeName,
      maxBlockingTime: 500,
    });
  }
}

export function getSqliteStorage(filename: string) {
  const db = new BetterSqliteDriver(filename);

  const rows = db.query<{ user_version: string }>("PRAGMA user_version", []);
  const userVersion = Number(rows[0]?.user_version) ?? 0;

  const migrations = getSQLiteMigrationQueries(userVersion);

  for (const migration of migrations) {
    db.run(migration, []);
  }

  return new StorageApiSync(new SQLiteClient(db));
}
