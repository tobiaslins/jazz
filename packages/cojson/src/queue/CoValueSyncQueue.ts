import {
  addTransactionToContentMessage,
  createContentMessage,
} from "../coValueContentMessage.js";
import { Transaction, VerifiedState } from "../coValueCore/verifiedState.js";
import { Signature } from "../crypto/crypto.js";
import { SessionID } from "../ids.js";
import { NewContentMessage } from "../sync.js";
import { LinkedList } from "./LinkedList.js";

export class CoValueSyncQueue {
  private readonly queue = new LinkedList<NewContentMessage>();

  constructor(private readonly sync: (content: NewContentMessage) => void) {}

  syncHeader = (coValue: VerifiedState) => {
    const lastPendingSync = this.queue.tail?.value;

    if (lastPendingSync?.id === coValue.id) {
      return;
    }

    this.enqueue(createContentMessage(coValue.id, coValue.header));
  };

  syncTransaction = (
    coValue: VerifiedState,
    transaction: Transaction,
    sessionID: SessionID,
    signature: Signature,
    txIdx: number,
  ) => {
    const lastPendingSync = this.queue.tail?.value;
    const lastSignatureIdx = coValue.getLastSignatureCheckpoint(sessionID);
    const isSignatureCheckpoint =
      lastSignatureIdx > -1 && lastSignatureIdx === txIdx - 1;

    if (lastPendingSync?.id === coValue.id && !isSignatureCheckpoint) {
      addTransactionToContentMessage(
        lastPendingSync,
        transaction,
        sessionID,
        signature,
        txIdx,
      );

      return;
    }

    const content = createContentMessage(coValue.id, coValue.header, false);

    addTransactionToContentMessage(
      content,
      transaction,
      sessionID,
      signature,
      txIdx,
    );

    this.enqueue(content);
  };

  enqueue(content: NewContentMessage) {
    this.queue.push(content);

    this.processPendingSyncs();
  }

  private processingSyncs = false;
  processPendingSyncs() {
    if (this.processingSyncs) return;

    this.processingSyncs = true;

    queueMicrotask(() => {
      while (this.queue.head) {
        const content = this.queue.head.value;

        this.sync(content);

        this.queue.shift();
      }

      this.processingSyncs = false;
    });
  }
}
