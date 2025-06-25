import {
  CojsonInternalTypes,
  MAX_RECOMMENDED_TX_SIZE,
  type SessionID,
  type StorageAPI,
  cojsonInternals,
  emptyKnownState,
} from "cojson";
import { collectNewTxs, getDependedOnCoValues } from "./syncUtils.js";
import type {
  DBClientInterfaceSync,
  SignatureAfterRow,
  StoredCoValueRow,
  StoredSessionRow,
} from "./types.js";

import RawCoID = CojsonInternalTypes.RawCoID;

export class StorageApiSync implements StorageAPI {
  private readonly dbClient: DBClientInterfaceSync;
  private loadedCoValues = new Set<RawCoID>();

  constructor(dbClient: DBClientInterfaceSync) {
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
    const coValueRow = this.dbClient.getCoValue(id);

    if (!coValueRow) {
      done?.(false);
      return;
    }

    const allCoValueSessions = this.dbClient.getCoValueSessions(
      coValueRow.rowID,
    );

    const signaturesBySession = new Map<
      SessionID,
      Pick<SignatureAfterRow, "idx" | "signature">[]
    >();

    let contentStreaming = false;
    for (const sessionRow of allCoValueSessions) {
      const signatures = this.dbClient.getSignatures(sessionRow.rowID, 0);

      if (signatures.length > 0) {
        contentStreaming = true;
        signaturesBySession.set(sessionRow.sessionID, signatures);
      }
    }

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
        const newTxsInSession = this.dbClient.getNewTransactionInSession(
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

          // Introduce a delay to not block the main thread
          // for the entire content processing
          await new Promise((resolve) => setTimeout(resolve));
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

  store(
    msgs: CojsonInternalTypes.NewContentMessage[],
    correctionCallback: (data: CojsonInternalTypes.CoValueKnownState) => void,
  ) {
    for (const msg of msgs) {
      const success = this.storeSingle(msg, correctionCallback);

      if (!success) {
        return false;
      }
    }
  }

  private storeSingle(
    msg: CojsonInternalTypes.NewContentMessage,
    correctionCallback: (data: CojsonInternalTypes.CoValueKnownState) => void,
  ): boolean {
    const coValueRow = this.dbClient.getCoValue(msg.id);

    // We have no info about coValue header
    const invalidAssumptionOnHeaderPresence = !msg.header && !coValueRow;

    if (invalidAssumptionOnHeaderPresence) {
      const knownState = emptyKnownState(msg.id);
      correctionCallback(knownState);

      this.knwonStates.set(msg.id, knownState);

      return false;
    }

    const storedCoValueRowID: number = coValueRow
      ? coValueRow.rowID
      : this.dbClient.addCoValue(msg);

    const ourKnown: CojsonInternalTypes.CoValueKnownState = {
      id: msg.id,
      header: true,
      sessions: {},
    };

    let invalidAssumptions = false;

    for (const sessionID of Object.keys(msg.new) as SessionID[]) {
      this.dbClient.transaction(() => {
        const sessionRow = this.dbClient.getSingleCoValueSession(
          storedCoValueRowID,
          sessionID,
        );

        if (sessionRow) {
          ourKnown.sessions[sessionRow.sessionID] = sessionRow.lastIdx;
        }

        if ((sessionRow?.lastIdx || 0) < (msg.new[sessionID]?.after || 0)) {
          invalidAssumptions = true;
        } else {
          const newLastIdx = this.putNewTxs(
            msg,
            sessionID,
            sessionRow,
            storedCoValueRowID,
          );
          ourKnown.sessions[sessionID] = newLastIdx;
        }
      });
    }

    if (invalidAssumptions) {
      correctionCallback(ourKnown);
      return false;
    }

    return true;
  }

  private putNewTxs(
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

    const sessionRowID: number = this.dbClient.addSessionUpdate({
      sessionUpdate,
      sessionRow,
    });

    if (shouldWriteSignature) {
      this.dbClient.addSignatureAfter({
        sessionRowID,
        idx: newLastIdx - 1,
        signature: msg.new[sessionID].lastSignature,
      });
    }

    actuallyNewTransactions.map((newTransaction, i) =>
      this.dbClient.addTransaction(sessionRowID, nextIdx + i, newTransaction),
    );

    return newLastIdx;
  }
}
