import {
  type NitroSQLiteConnection as DatabaseT,
  NitroSQLite,
  open,
} from "react-native-nitro-sqlite";

import { CojsonInternalTypes, type OutgoingSyncQueue, SessionID } from "cojson";
import RawCoID = CojsonInternalTypes.RawCoID;
import Signature = CojsonInternalTypes.Signature;
import Transaction = CojsonInternalTypes.Transaction;
import type {
  DBClientInterface,
  SessionRow,
  SignatureAfterRow,
  StoredCoValueRow,
  StoredSessionRow,
  TransactionRow,
} from "cojson-storage";

export type RawCoValueRow = {
  id: CojsonInternalTypes.RawCoID;
  header: string;
};

export type RawTransactionRow = {
  ses: number;
  idx: number;
  tx: string;
};

export class SQLiteClient implements DBClientInterface {
  private readonly db: DatabaseT;
  private readonly toLocalNode: OutgoingSyncQueue;

  constructor(db: DatabaseT, toLocalNode: OutgoingSyncQueue) {
    this.db = db;
    this.toLocalNode = toLocalNode;
    console.log("SQLiteClient constructor");
  }

  getCoValue(coValueId: RawCoID): StoredCoValueRow | undefined {
    console.log("getCoValue", coValueId);
    const { rows } = this.db.execute<RawCoValueRow & { rowID: number }>(
      "SELECT * FROM coValues WHERE id = ?",
      [coValueId],
    );

    if (!rows || rows.length === 0) return;

    const coValueRow = rows._array[0] as RawCoValueRow & { rowID: number };
    try {
      const parsedHeader = (coValueRow?.header &&
        JSON.parse(coValueRow.header)) as CojsonInternalTypes.CoValueHeader;

      return {
        ...coValueRow,
        header: parsedHeader,
      };
    } catch (e) {
      console.warn(coValueId, "Invalid JSON in header", e, coValueRow?.header);
      return;
    }
  }

  getCoValueSessions(coValueRowId: number): StoredSessionRow[] {
    console.log("getCoValueSessions", coValueRowId);
    const { rows } = this.db.execute<StoredSessionRow>(
      "SELECT * FROM sessions WHERE coValue = ?",
      [coValueRowId],
    );

    return rows?._array as StoredSessionRow[];
  }

  getNewTransactionInSession(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): TransactionRow[] {
    console.log("getNewTransactionInSession", sessionRowId, firstNewTxIdx);
    const { rows } = this.db.execute<RawTransactionRow & { rowID: number }>(
      "SELECT * FROM transactions WHERE ses = ? AND idx >= ?",
      [sessionRowId, firstNewTxIdx],
    );

    if (!rows || rows.length === 0) return [];

    const txs = rows._array as RawTransactionRow[];

    try {
      return txs.map((transactionRow) => ({
        ...transactionRow,
        tx: JSON.parse(transactionRow.tx) as Transaction,
      }));
    } catch (e) {
      console.warn("Invalid JSON in transaction", e);
      return [];
    }
  }

  getSignatures(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): SignatureAfterRow[] {
    console.log("getSignatures", sessionRowId, firstNewTxIdx);
    const { rows } = this.db.execute<SignatureAfterRow>(
      "SELECT * FROM signatureAfter WHERE ses = ? AND idx >= ?",
      [sessionRowId, firstNewTxIdx],
    );

    return rows?._array as SignatureAfterRow[];
  }

  addCoValue(msg: CojsonInternalTypes.NewContentMessage): number {
    console.log("addCoValue", msg.id);
    const { rows } = this.db.execute(
      "INSERT INTO coValues (id, header) VALUES (?, ?)",
      [msg.id, JSON.stringify(msg.header)],
    );

    return rows?._array[0]?.rowID as number;
  }

  addSessionUpdate({
    sessionUpdate,
    sessionRow,
  }: {
    sessionUpdate: SessionRow;
    sessionRow?: StoredSessionRow;
  }): number {
    console.log(
      "addSessionUpdate",
      sessionUpdate.coValue,
      sessionUpdate.sessionID,
    );
    const { rows } = this.db.execute(
      `INSERT INTO sessions (coValue, sessionID, lastIdx, lastSignature, bytesSinceLastSignature) VALUES (?, ?, ?, ?, ?)
                            ON CONFLICT(coValue, sessionID) DO UPDATE SET lastIdx=excluded.lastIdx, lastSignature=excluded.lastSignature, bytesSinceLastSignature=excluded.bytesSinceLastSignature
                            RETURNING rowID`,
      [
        sessionUpdate.coValue,
        sessionUpdate.sessionID,
        sessionUpdate.lastIdx,
        sessionUpdate.lastSignature,
        sessionUpdate.bytesSinceLastSignature,
      ],
    );

    if (!rows || rows.length === 0) return 0;

    return rows._array[0]?.rowID as number;
  }

  addTransaction(
    sessionRowID: number,
    nextIdx: number,
    newTransaction: Transaction,
  ): number {
    console.log("addTransaction", sessionRowID, nextIdx);
    const { rows } = this.db.execute(
      "INSERT INTO transactions (ses, idx, tx) VALUES (?, ?, ?)",
      [sessionRowID, nextIdx, JSON.stringify(newTransaction)],
    );

    if (!rows || rows.length === 0) return 0;

    return rows._array[0]?.rowID as number;
  }

  addSignatureAfter({
    sessionRowID,
    idx,
    signature,
  }: {
    sessionRowID: number;
    idx: number;
    signature: Signature;
  }) {
    console.log("addSignatureAfter", sessionRowID, idx);
    const { rows } = this.db.execute(
      "INSERT INTO signatureAfter (ses, idx, signature) VALUES (?, ?, ?)",
      [sessionRowID, idx, signature],
    );

    if (!rows || rows.length === 0) return 0;

    return rows._array[0]?.rowID as number;
  }

  unitOfWork(operationsCallback: () => any[]) {
    // @ts-ignore
    this.db.transaction(operationsCallback)();
  }
}
