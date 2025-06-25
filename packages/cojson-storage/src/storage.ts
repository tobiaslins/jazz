import {
  type CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  type SessionID,
  type StorageAPI,
  cojsonInternals,
  emptyKnownState,
} from "cojson";
import { collectNewTxs, getDependedOnCoValues } from "./syncUtils.js";
import type {
  DBClientInterfaceAsync,
  SignatureAfterRow,
  StoredCoValueRow,
  StoredSessionRow,
} from "./types.js";

type RawCoID = CojsonInternalTypes.RawCoID;

export class StorageApiAsync implements StorageAPI {
  private readonly dbClient: DBClientInterfaceAsync;

  private loadedCoValues = new Set<RawCoID>();

  constructor(dbClient: DBClientInterfaceAsync) {
    this.dbClient = dbClient;
  }

  knwonStates = new Map<string, CojsonInternalTypes.CoValueKnownState>();

  getKnownState(id: string): CojsonInternalTypes.CoValueKnownState {
    return this.knwonStates.get(id) ?? emptyKnownState(id as RawCoID);
  }

  async load(
    id: string,
    callback: (data: CojsonInternalTypes.NewContentMessage) => void,
    done?: (found: boolean) => void,
  ) {
    const coValueRow = await this.dbClient.getCoValue(id);

    if (!coValueRow) {
      done?.(false);
      return;
    }

    const allCoValueSessions = await this.dbClient.getCoValueSessions(
      coValueRow.rowID,
    );

    const signaturesBySession = new Map<
      SessionID,
      Pick<SignatureAfterRow, "idx" | "signature">[]
    >();

    let contentStreaming = false;

    await Promise.all(
      allCoValueSessions.map(async (sessionRow) => {
        const signatures = await this.dbClient.getSignatures(
          sessionRow.rowID,
          0,
        );

        if (signatures.length > 0) {
          contentStreaming = true;
          signaturesBySession.set(sessionRow.sessionID, signatures);
        }
      }),
    );

    const knownState =
      this.knwonStates.get(coValueRow.id) ?? emptyKnownState(coValueRow.id);

    for (const sessionRow of allCoValueSessions) {
      knownState.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
    }

    this.knwonStates.set(coValueRow.id, knownState);
    this.loadedCoValues.add(coValueRow.id);

    let contentMessage = {
      action: "content",
      id: coValueRow.id,
      header: coValueRow.header,
      new: {},
      priority: cojsonInternals.getPriorityFromHeader(coValueRow.header),
    } satisfies CojsonInternalTypes.NewContentMessage;

    for (const sessionRow of allCoValueSessions) {
      const signatures = signaturesBySession.get(sessionRow.sessionID) || [];

      let idx = 0;

      signatures.push({
        idx: sessionRow.lastIdx,
        signature: sessionRow.lastSignature,
      });

      for (const signature of signatures) {
        const newTxsInSession = await this.dbClient.getNewTransactionInSession(
          sessionRow.rowID,
          idx,
          signature.idx,
        );

        collectNewTxs({
          newTxsInSession,
          contentMessage,
          sessionRow,
          firstNewTxIdx: idx,
          signature: signature.signature,
        });

        idx = signature.idx + 1;

        if (signatures.length > 1) {
          this.pushContentWithDependencies(
            coValueRow,
            contentMessage,
            callback,
          );
          contentMessage = {
            action: "content",
            id: coValueRow.id,
            header: coValueRow.header,
            new: {},
            priority: cojsonInternals.getPriorityFromHeader(coValueRow.header),
          } satisfies CojsonInternalTypes.NewContentMessage;
        }
      }
    }

    if (Object.keys(contentMessage.new).length === 0 && contentStreaming) {
      done?.(true);
      return;
    }

    this.pushContentWithDependencies(coValueRow, contentMessage, callback);
    done?.(true);
  }

  async pushContentWithDependencies(
    coValueRow: StoredCoValueRow,
    contentMessage: CojsonInternalTypes.NewContentMessage,
    pushCallback: (data: CojsonInternalTypes.NewContentMessage) => void,
  ) {
    const dependedOnCoValuesList = getDependedOnCoValues(
      coValueRow.header,
      contentMessage,
    );

    for (const dependedOnCoValue of dependedOnCoValuesList) {
      if (this.loadedCoValues.has(dependedOnCoValue)) {
        continue;
      }

      this.load(dependedOnCoValue, pushCallback);
    }

    pushCallback(contentMessage);
  }

  storeQueue = new Map<string, CojsonInternalTypes.NewContentMessage[]>();

  async store(
    id: string,
    msgs: CojsonInternalTypes.NewContentMessage[],
    correctionCallback: (data: CojsonInternalTypes.CoValueKnownState) => void,
  ) {
    const queue = this.storeQueue.get(id);

    if (queue) {
      queue.push(...msgs);
      return;
    }

    this.storeQueue.set(id, msgs);

    for (const msg of msgs) {
      const success = await this.storeSingle(id, msg, correctionCallback);

      if (!success) {
        return false;
      }
    }

    this.storeQueue.delete(id);
  }

  private async storeSingle(
    id: string,
    msg: CojsonInternalTypes.NewContentMessage,
    correctionCallback: (data: CojsonInternalTypes.CoValueKnownState) => void,
  ): Promise<boolean> {
    const coValueRow = await this.dbClient.getCoValue(id);

    // We have no info about coValue header
    const invalidAssumptionOnHeaderPresence = !msg.header && !coValueRow;

    if (invalidAssumptionOnHeaderPresence) {
      const knownState = emptyKnownState(id as RawCoID);
      this.knwonStates.set(id, knownState);

      this.storeQueue.delete(id);
      correctionCallback(knownState);
      return false;
    }

    const storedCoValueRowID: number = coValueRow
      ? coValueRow.rowID
      : await this.dbClient.addCoValue(msg);

    const knownState =
      this.knwonStates.get(id) ?? emptyKnownState(id as RawCoID);
    this.knwonStates.set(id, knownState);

    let invalidAssumptions = false;

    for (const sessionID of Object.keys(msg.new) as SessionID[]) {
      await this.dbClient.transaction(async () => {
        const sessionRow = await this.dbClient.getSingleCoValueSession(
          storedCoValueRowID,
          sessionID,
        );

        if (sessionRow) {
          knownState.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
        }

        if ((sessionRow?.lastIdx || 0) < (msg.new[sessionID]?.after || 0)) {
          invalidAssumptions = true;
        } else {
          const newLastIdx = await this.putNewTxs(
            msg,
            sessionID,
            sessionRow,
            storedCoValueRowID,
          );
          knownState.sessions[sessionID] = newLastIdx;
        }
      });
    }

    if (invalidAssumptions) {
      this.storeQueue.delete(id);
      correctionCallback(knownState);
      return false;
    }

    return true;
  }

  private async putNewTxs(
    msg: CojsonInternalTypes.NewContentMessage,
    sessionID: SessionID,
    sessionRow: StoredSessionRow | undefined,
    storedCoValueRowID: number,
  ) {
    const newTransactions = msg.new[sessionID]?.newTransactions || [];

    const actuallyNewOffset =
      (sessionRow?.lastIdx || 0) - (msg.new[sessionID]?.after || 0);

    const actuallyNewTransactions = newTransactions.slice(actuallyNewOffset);

    let newBytesSinceLastSignature =
      (sessionRow?.bytesSinceLastSignature || 0) +
      actuallyNewTransactions.reduce(
        (sum, tx) =>
          sum +
          (tx.privacy === "private"
            ? tx.encryptedChanges.length
            : tx.changes.length),
        0,
      );

    const newLastIdx =
      (sessionRow?.lastIdx || 0) + actuallyNewTransactions.length;

    let shouldWriteSignature = false;

    if (newBytesSinceLastSignature > MAX_RECOMMENDED_TX_SIZE) {
      shouldWriteSignature = true;
      newBytesSinceLastSignature = 0;
    }

    const nextIdx = sessionRow?.lastIdx || 0;

    if (!msg.new[sessionID]) throw new Error("Session ID not found");

    const sessionUpdate = {
      coValue: storedCoValueRowID,
      sessionID,
      lastIdx: newLastIdx,
      lastSignature: msg.new[sessionID].lastSignature,
      bytesSinceLastSignature: newBytesSinceLastSignature,
    };

    const sessionRowID: number = await this.dbClient.addSessionUpdate({
      sessionUpdate,
      sessionRow,
    });

    if (shouldWriteSignature) {
      await this.dbClient.addSignatureAfter({
        sessionRowID,
        idx: newLastIdx - 1,
        signature: msg.new[sessionID].lastSignature,
      });
    }

    await Promise.all(
      actuallyNewTransactions.map((newTransaction, i) =>
        this.dbClient.addTransaction(sessionRowID, nextIdx + i, newTransaction),
      ),
    );

    return newLastIdx;
  }
}
