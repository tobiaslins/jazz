import { Result, err, ok } from "neverthrow";
import { ControlledAccountOrAgent } from "../coValues/account.js";
import type {
  CryptoProvider,
  Hash,
  KeyID,
  KeySecret,
  SessionLogImpl,
  Signature,
  SignerID,
} from "../crypto/crypto.js";
import { RawCoID, SessionID } from "../ids.js";
import { stableStringify } from "../jsonStringify.js";
import { JsonValue } from "../jsonValue.js";
import { CoValueKnownState } from "../sync.js";
import { TryAddTransactionsError } from "./coValueCore.js";
import { Transaction } from "./verifiedState.js";
import { exceedsRecommendedSize } from "../coValueContentMessage.js";

export type SessionLog = {
  signerID: SignerID;
  impl: SessionLogImpl;
  transactions: Transaction[];
  lastSignature: Signature | undefined;
  signatureAfter: { [txIdx: number]: Signature | undefined };
  txSizeSinceLastInbetweenSignature: number;
};

export class SessionMap {
  sessions: Map<SessionID, SessionLog> = new Map();

  constructor(
    private readonly id: RawCoID,
    private readonly crypto: CryptoProvider,
  ) {}

  get(sessionID: SessionID): SessionLog | undefined {
    return this.sessions.get(sessionID);
  }

  private getOrCreateSessionLog(
    sessionID: SessionID,
    signerID: SignerID,
  ): SessionLog {
    let sessionLog = this.sessions.get(sessionID);
    if (!sessionLog) {
      sessionLog = {
        signerID,
        impl: this.crypto.createSessionLog(this.id, sessionID, signerID),
        transactions: [],
        lastSignature: undefined,
        signatureAfter: {},
        txSizeSinceLastInbetweenSignature: 0,
      };
      this.sessions.set(sessionID, sessionLog);
    }

    return sessionLog;
  }

  addTransaction(
    sessionID: SessionID,
    signerID: SignerID,
    newTransactions: Transaction[],
    newSignature: Signature,
    skipVerify: boolean = false,
  ): Result<true, TryAddTransactionsError> {
    const sessionLog = this.getOrCreateSessionLog(sessionID, signerID);

    try {
      sessionLog.impl.tryAdd(newTransactions, newSignature, skipVerify);

      this.addTransactionsToJsLog(sessionLog, newTransactions, newSignature);

      return ok(true as const);
    } catch (e) {
      return err({
        type: "InvalidSignature",
        id: this.id,
        sessionID,
        newSignature,
        signerID,
      } satisfies TryAddTransactionsError);
    }
  }

  makeNewPrivateTransaction(
    sessionID: SessionID,
    signerAgent: ControlledAccountOrAgent,
    changes: JsonValue[],
    keyID: KeyID,
    keySecret: KeySecret,
  ): { signature: Signature; transaction: Transaction } {
    const sessionLog = this.getOrCreateSessionLog(
      sessionID,
      signerAgent.currentSignerID(),
    );

    const madeAt = Date.now();

    const result = sessionLog.impl.addNewPrivateTransaction(
      signerAgent,
      changes,
      keyID,
      keySecret,
      madeAt,
    );

    this.addTransactionsToJsLog(
      sessionLog,
      [result.transaction],
      result.signature,
    );

    return result;
  }

  makeNewTrustingTransaction(
    sessionID: SessionID,
    signerAgent: ControlledAccountOrAgent,
    changes: JsonValue[],
  ): { signature: Signature; transaction: Transaction } {
    const sessionLog = this.getOrCreateSessionLog(
      sessionID,
      signerAgent.currentSignerID(),
    );

    const madeAt = Date.now();

    const result = sessionLog.impl.addNewTrustingTransaction(
      signerAgent,
      changes,
      madeAt,
    );

    this.addTransactionsToJsLog(
      sessionLog,
      [result.transaction],
      result.signature,
    );

    return result;
  }

  private addTransactionsToJsLog(
    sessionLog: SessionLog,
    newTransactions: Transaction[],
    signature: Signature,
  ) {
    for (const tx of newTransactions) {
      sessionLog.transactions.push(tx);
    }
    sessionLog.lastSignature = signature;

    sessionLog.txSizeSinceLastInbetweenSignature += newTransactions.reduce(
      (sum, tx) =>
        sum +
        (tx.privacy === "private"
          ? tx.encryptedChanges.length
          : tx.changes.length),
      0,
    );

    if (exceedsRecommendedSize(sessionLog.txSizeSinceLastInbetweenSignature)) {
      sessionLog.signatureAfter[sessionLog.transactions.length - 1] = signature;
      sessionLog.txSizeSinceLastInbetweenSignature = 0;
    }
  }

  // TODO: Shall we get rid of this?
  testExpectedHashAfter(
    sessionID: SessionID,
    transactions: Transaction[],
  ): { expectedNewHash: Hash } {
    let sessionLog = this.sessions.get(sessionID);
    if (!sessionLog) {
      // TODO: this is ugly
      const ephemeralSigner = this.crypto.newRandomSigner();
      const ephemeralSignerID = this.crypto.getSignerID(ephemeralSigner);

      const ephemeralSessionLog = this.crypto.createSessionLog(
        this.id,
        sessionID,
        ephemeralSignerID,
      );
      const result = ephemeralSessionLog.testExpectedHashAfter(
        transactions.map((tx) => stableStringify(tx)),
      );
      ephemeralSessionLog.free();
      return { expectedNewHash: result as Hash };
    }
    return {
      expectedNewHash: sessionLog.impl.testExpectedHashAfter(
        transactions.map((tx) => stableStringify(tx)),
      ) as Hash,
    };
  }

  knownState(): CoValueKnownState {
    const sessions: CoValueKnownState["sessions"] = {};
    for (const [sessionID, sessionLog] of this.sessions.entries()) {
      sessions[sessionID] = sessionLog.transactions.length;
    }
    return { id: this.id, header: true, sessions };
  }

  get size() {
    return this.sessions.size;
  }

  entries() {
    return this.sessions.entries();
  }

  values() {
    return this.sessions.values();
  }

  keys() {
    return this.sessions.keys();
  }

  clone(): SessionMap {
    const clone = new SessionMap(this.id, this.crypto);

    for (const [sessionID, sessionLog] of this.sessions) {
      clone.sessions.set(sessionID, {
        impl: sessionLog.impl.clone(),
        transactions: sessionLog.transactions.slice(),
        lastSignature: sessionLog.lastSignature,
        signatureAfter: { ...sessionLog.signatureAfter },
        txSizeSinceLastInbetweenSignature:
          sessionLog.txSizeSinceLastInbetweenSignature,
        signerID: sessionLog.signerID,
      });
    }

    return clone;
  }
}
