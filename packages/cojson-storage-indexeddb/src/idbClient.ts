import type { CojsonInternalTypes, RawCoID } from "cojson";
import type {
  CoValueRow,
  DBClientInterface,
  SessionRow,
  SignatureAfterRow,
  StoredCoValueRow,
  StoredSessionRow,
  TransactionRow,
} from "cojson-storage";
import { SyncPromise } from "./syncPromises.js";

type TxEntry = {
  id: number;
  tx: IDBTransaction;
  stores: {
    coValues: IDBObjectStore;
    sessions: IDBObjectStore;
    transactions: IDBObjectStore;
    signatureAfter: IDBObjectStore;
  };
  running: boolean;
  startedAt: number;
  isControlledTransaction?: boolean;
  pendingRequests: ((txEntry: TxEntry) => void)[];
};

export class IDBClient implements DBClientInterface {
  private db;

  currentTx: TxEntry | undefined;

  currentTxID = 0;

  constructor(db: IDBDatabase) {
    this.db = db;
  }

  makeRequest<T>(
    handler: (stores: {
      coValues: IDBObjectStore;
      sessions: IDBObjectStore;
      transactions: IDBObjectStore;
      signatureAfter: IDBObjectStore;
    }) => IDBRequest,
  ): SyncPromise<T> {
    return new SyncPromise((resolve, reject) => {
      let txEntry = this.currentTx;

      const requestEntry = (txEntry: TxEntry) => {
        txEntry.running = true;
        const request = handler(txEntry.stores);
        request.onerror = () => {
          console.error("Error in request", request.error);
          txEntry.running = false;
          if (txEntry === this.currentTx) {
            this.currentTx = undefined;
          }
          reject(request.error);
        };
        request.onsuccess = () => {
          const value = request.result as T;
          resolve(value);

          const next = txEntry?.pendingRequests.shift();

          if (next) {
            next(txEntry);
          } else {
            txEntry.running = false;

            if (txEntry === this.currentTx) {
              this.currentTx = undefined;
            }
          }
        };
      };

      // Do we have an active transaction?
      // If yes, reuse it.
      // If no, create a new one.
      if (!txEntry?.isControlledTransaction) {
        const tx = this.db.transaction(
          ["coValues", "sessions", "transactions", "signatureAfter"],
          "readwrite",
        );
        txEntry = {
          id: this.currentTxID++,
          tx,
          stores: {
            coValues: tx.objectStore("coValues"),
            sessions: tx.objectStore("sessions"),
            transactions: tx.objectStore("transactions"),
            signatureAfter: tx.objectStore("signatureAfter"),
          },
          startedAt: performance.now(),
          pendingRequests: [],
          running: false,
        } satisfies TxEntry;

        requestEntry(txEntry);
      } else {
        if (txEntry.running) {
          txEntry.pendingRequests.push(requestEntry);
        } else {
          requestEntry(txEntry);
        }
      }
    });
  }

  startTransaction() {
    const tx = this.db.transaction(
      ["coValues", "sessions", "transactions", "signatureAfter"],
      "readwrite",
    );

    const txEntry = {
      id: this.currentTxID++,
      tx,
      stores: {
        coValues: tx.objectStore("coValues"),
        sessions: tx.objectStore("sessions"),
        transactions: tx.objectStore("transactions"),
        signatureAfter: tx.objectStore("signatureAfter"),
      },
      isControlledTransaction: true,
      startedAt: performance.now(),
      pendingRequests: [],
      running: false,
    } satisfies TxEntry;

    this.currentTx = txEntry;

    return txEntry;
  }

  closeTransaction(txEntry: TxEntry) {
    if (txEntry === this.currentTx) {
      this.currentTx = undefined;
    }
  }

  async getCoValue(coValueId: RawCoID): Promise<StoredCoValueRow | undefined> {
    return this.makeRequest<StoredCoValueRow | undefined>(({ coValues }) =>
      coValues.index("coValuesById").get(coValueId),
    );
  }

  async getCoValueSessions(coValueRowId: number): Promise<StoredSessionRow[]> {
    return this.makeRequest<StoredSessionRow[]>(({ sessions }) =>
      sessions.index("sessionsByCoValue").getAll(coValueRowId),
    );
  }

  async getNewTransactionInSession(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Promise<TransactionRow[]> {
    return this.makeRequest<TransactionRow[]>(({ transactions }) =>
      transactions.getAll(
        IDBKeyRange.bound(
          [sessionRowId, firstNewTxIdx],
          [sessionRowId, Number.POSITIVE_INFINITY],
        ),
      ),
    );
  }

  async getSignatures(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Promise<SignatureAfterRow[]> {
    return this.makeRequest<SignatureAfterRow[]>(
      ({ signatureAfter }: { signatureAfter: IDBObjectStore }) =>
        signatureAfter.getAll(
          IDBKeyRange.bound(
            [sessionRowId, firstNewTxIdx],
            [sessionRowId, Number.POSITIVE_INFINITY],
          ),
        ),
    );
  }

  async addCoValue(
    msg: CojsonInternalTypes.NewContentMessage,
  ): Promise<number> {
    if (!msg.header) {
      throw new Error(`Header is required, coId: ${msg.id}`);
    }

    return (await this.makeRequest<IDBValidKey>(({ coValues }) =>
      coValues.put({
        id: msg.id,
        // biome-ignore lint/style/noNonNullAssertion: TODO(JAZZ-561): Review
        header: msg.header!,
      } satisfies CoValueRow),
    )) as number;
  }

  async addSessionUpdate({
    sessionUpdate,
    sessionRow,
  }: {
    sessionUpdate: SessionRow;
    sessionRow?: StoredSessionRow;
  }): Promise<number> {
    return this.makeRequest<number>(({ sessions }) =>
      sessions.put(
        sessionRow?.rowID
          ? {
              rowID: sessionRow.rowID,
              ...sessionUpdate,
            }
          : sessionUpdate,
      ),
    );
  }

  addTransaction(
    sessionRowID: number,
    idx: number,
    newTransaction: CojsonInternalTypes.Transaction,
  ) {
    return this.makeRequest(({ transactions }) =>
      transactions.add({
        ses: sessionRowID,
        idx,
        tx: newTransaction,
      } satisfies TransactionRow),
    );
  }

  async addSignatureAfter({
    sessionRowID,
    idx,
    signature,
  }: {
    sessionRowID: number;
    idx: number;
    signature: CojsonInternalTypes.Signature;
  }) {
    return this.makeRequest(({ signatureAfter }) =>
      signatureAfter.put({
        ses: sessionRowID,
        idx,
        signature,
      } satisfies SignatureAfterRow),
    );
  }

  async transaction(operationsCallback: () => unknown) {
    const txEntry = this.startTransaction();
    try {
      await operationsCallback();
      this.closeTransaction(txEntry);
    } catch (error) {
      txEntry.tx.abort();
      this.closeTransaction(txEntry);
      throw error;
    }
  }
}
