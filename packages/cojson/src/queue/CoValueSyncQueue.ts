import {
  addTransactionToContentMessage,
  createContentMessage,
  exceedsRecommendedSize,
  getTransactionSize,
} from "../coValueContentMessage.js";
import { Transaction, VerifiedState } from "../coValueCore/verifiedState.js";
import { Signature } from "../crypto/crypto.js";
import { SessionID } from "../ids.js";
import { NewContentMessage } from "../sync.js";
import { LinkedList } from "./LinkedList.js";

export class CoValueSyncQueue {
  private readonly queue = new LinkedList<{
    msg: NewContentMessage;
    size: number;
  }>();

  constructor(private readonly sync: (content: NewContentMessage) => void) {}

  syncHeader = (coValue: VerifiedState) => {
    const lastPendingSync = this.queue.tail?.value;

    if (lastPendingSync?.msg.id === coValue.id) {
      return;
    }

    this.enqueue({
      msg: createContentMessage(coValue.id, coValue.header),
      size: 0,
    });
  };

  syncLocalTransaction = (
    coValue: VerifiedState,
    transaction: Transaction,
    sessionID: SessionID,
    signature: Signature,
    txIdx: number,
  ) => {
    const lastPendingSync = this.queue.tail?.value;

    const size = getTransactionSize(transaction);

    if (
      lastPendingSync?.msg.id === coValue.id &&
      !exceedsRecommendedSize(lastPendingSync.size, size)
    ) {
      addTransactionToContentMessage(
        lastPendingSync.msg,
        transaction,
        sessionID,
        signature,
        txIdx,
      );
      lastPendingSync.size += size;

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

    this.enqueue({
      msg: content,
      size,
    });
  };

  enqueue(content: { msg: NewContentMessage; size: number }) {
    this.queue.push(content);

    this.processPendingSyncs();
  }

  private processingSyncs = false;
  processPendingSyncs() {
    if (this.processingSyncs) return;

    this.processingSyncs = true;

    queueMicrotask(() => {
      while (this.queue.head) {
        const { msg } = this.queue.head.value;

        this.sync(msg);

        this.queue.shift();
      }

      this.processingSyncs = false;
    });
  }
}
