import type {
  CoValueHeader,
  Transaction,
} from "../coValueCore/verifiedState.js";
import { Signature } from "../crypto/crypto.js";
import type { RawCoID, SessionID } from "../exports.js";
import { CoValueKnownState, NewContentMessage } from "../sync.js";

export interface StorageAPI {
  load(
    id: string,
    callback: (data: NewContentMessage) => void,
    done?: (found: boolean) => void,
  ): void;
  store(
    id: string,
    data: NewContentMessage[] | undefined,
    handleCorrection: (correction: CoValueKnownState) => void,
  ): void;

  getKnownState(id: string): CoValueKnownState;

  waitForSync(id: string, knownState: CoValueKnownState): Promise<void>;

  close(): void;
}

export type CoValueRow = {
  id: RawCoID;
  header: CoValueHeader;
};

export type StoredCoValueRow = CoValueRow & { rowID: number };

export type SessionRow = {
  coValue: number;
  sessionID: SessionID;
  lastIdx: number;
  lastSignature: Signature;
  bytesSinceLastSignature?: number;
};

export type StoredSessionRow = SessionRow & { rowID: number };

export type TransactionRow = {
  ses: number;
  idx: number;
  tx: Transaction;
};

export type SignatureAfterRow = {
  ses: number;
  idx: number;
  signature: Signature;
};

export interface DBClientInterfaceAsync {
  getCoValue(
    coValueId: string,
  ): Promise<StoredCoValueRow | undefined> | undefined;

  getCoValueSessions(coValueRowId: number): Promise<StoredSessionRow[]>;

  getSingleCoValueSession(
    coValueRowId: number,
    sessionID: SessionID,
  ): Promise<StoredSessionRow | undefined>;

  getNewTransactionInSession(
    sessionRowId: number,
    fromIdx: number,
    toIdx: number,
  ): Promise<TransactionRow[]>;

  getSignatures(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Promise<SignatureAfterRow[]>;

  addCoValue(msg: NewContentMessage): Promise<number>;

  addSessionUpdate({
    sessionUpdate,
    sessionRow,
  }: {
    sessionUpdate: SessionRow;
    sessionRow?: StoredSessionRow;
  }): Promise<number>;

  addTransaction(
    sessionRowID: number,
    idx: number,
    newTransaction: Transaction,
  ): Promise<number> | undefined | unknown;

  addSignatureAfter({
    sessionRowID,
    idx,
    signature,
  }: {
    sessionRowID: number;
    idx: number;
    signature: Signature;
  }): Promise<unknown>;

  transaction(callback: () => unknown): Promise<unknown>;
}

export interface DBClientInterfaceSync {
  getCoValue(coValueId: string): StoredCoValueRow | undefined;

  getCoValueSessions(coValueRowId: number): StoredSessionRow[];

  getSingleCoValueSession(
    coValueRowId: number,
    sessionID: SessionID,
  ): StoredSessionRow | undefined;

  getNewTransactionInSession(
    sessionRowId: number,
    fromIdx: number,
    toIdx: number,
  ): TransactionRow[];

  getSignatures(
    sessionRowId: number,
    firstNewTxIdx: number,
  ): Pick<SignatureAfterRow, "idx" | "signature">[];

  addCoValue(msg: NewContentMessage): number;

  addSessionUpdate({
    sessionUpdate,
    sessionRow,
  }: {
    sessionUpdate: SessionRow;
    sessionRow?: StoredSessionRow;
  }): number;

  addTransaction(
    sessionRowID: number,
    idx: number,
    newTransaction: Transaction,
  ): number | undefined | unknown;

  addSignatureAfter({
    sessionRowID,
    idx,
    signature,
  }: {
    sessionRowID: number;
    idx: number;
    signature: Signature;
  }): number | undefined | unknown;

  transaction(callback: () => unknown): unknown;
}
