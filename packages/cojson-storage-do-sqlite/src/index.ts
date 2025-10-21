import type { SQLiteDatabaseDriver } from "cojson";
import { StorageApiSync } from "cojson";
import type { DurableObjectStorage } from "@cloudflare/workers-types";
import { getSQLiteMigrationQueries } from "cojson/src/storage/sqlite/sqliteMigrations.js";
import { SQLiteClient } from "cojson/dist/storage/sqlite/client.js";

export class DurableObjectSqlDriver implements SQLiteDatabaseDriver {
  private readonly storage: DurableObjectStorage;

  constructor(durableObjectStorage: DurableObjectStorage) {
    this.storage = durableObjectStorage;
  }

  run(sql: string, params: unknown[]) {
    this.storage.sql.exec(sql, ...params);
  }

  query<T>(sql: string, params: unknown[]): T[] {
    return this.storage.sql.exec(sql, ...params).toArray() as T[];
  }

  get<T>(sql: string, params: unknown[]): T | undefined {
    const res = this.storage.sql.exec(sql, ...params);
    if (res.rowsRead === 0) {
      return undefined;
    }
    return res.one() as T;
  }

  transaction(callback: () => unknown) {
    return this.storage.transactionSync(callback);
  }

  closeDb() {
    return;
  }
}

export function getDurableObjectSqlStorage(
  durableObjectStorage: DurableObjectStorage,
) {
  /*
  Cannot use getSqliteStorage directly due the way migration versions are managed
  the migration files use PRAGMA user_version = 1; and Cloudflare Durable Objects
  do not support that so we need to overwrite those with migration table.
  */
  const driver = new DurableObjectSqlDriver(durableObjectStorage);
  driver.run(
    "CREATE TABLE IF NOT EXISTS _migration_version (version INTEGER);",
    [],
  );
  const version = driver.get<{ version: number }>(
    "SELECT max(version) as version FROM _migration_version;",
    [],
  )?.version;

  const migrations = getSQLiteMigrationQueries(version ?? 0);
  for (const migration of migrations) {
    if (migration.startsWith("PRAGMA")) {
      // Is in format of "PRAGMA user_version = 1;"
      const match = migration.match(/user_version = (\d+)/);
      if (match && match[1]) {
        const parsedVersion = parseInt(match[1]);
        driver.run("INSERT INTO _migration_version (version) VALUES (?);", [
          parsedVersion,
        ]);
      } else {
        throw new Error(`Unsupported pragma in migration: ${migration}`);
      }
    } else {
      driver.run(migration, []);
    }
  }
  return new StorageApiSync(new SQLiteClient(driver));
}
