import {
  addTransactionToContentMessage,
  createContentMessage,
  knownStateFromContent,
} from "../coValueContentMessage.js";
import { Transaction, VerifiedState } from "../coValueCore/verifiedState.js";
import { Signature } from "../crypto/crypto.js";
import { RawCoID, SessionID } from "../ids.js";
import {
  combineKnownStateSessions,
  KnownStateSessions,
} from "../knownState.js";
import { NewContentMessage } from "../sync.js";
import { LinkedList } from "./LinkedList.js";

/**
 * This queue is used to batch the sync of local transactions while preserving the order of updates between CoValues.
 *
 * We need to preserve the order of updates between CoValues to keep the state always consistent in case of shutdown in the middle of a sync.
 *
 * Examples:
 * 1. When we extend a Group we need to always ensure that the parent group is persisted before persisting the extension transaction.
 * 2. If we do multiple updates on the same CoMap, the updates will be batched because it's safe to do so.
 */
export class LocalTransactionsSyncQueue {
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
      lastSignatureIdx > -1 && lastSignatureIdx === txIdx;

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

    for (const trackingSet of this.dirtyCoValuesTrackingSets) {
      trackingSet.add(content.id);
    }
  }

  private dirtyCoValuesTrackingSets: Set<Set<RawCoID>> = new Set();

  /**
   * It starts tracking all changed CoValues. Returns a `done()` function that returns a set of coValues' ids that have been modified since the start.
   *
   * @example
   * ```ts
   * const tracking = node.syncManager.trackDirtyCoValues();
   * // Any CoValue mutation
   * const tracked = tracking.done();
   * console.log("CoValue mutated: " Array.from(tracked))
   * ```
   */
  trackDirtyCoValues = () => {
    const trackingSet = new Set<RawCoID>();

    this.dirtyCoValuesTrackingSets.add(trackingSet);

    return {
      done: () => {
        this.dirtyCoValuesTrackingSets.delete(trackingSet);

        return trackingSet;
      },
    };
  };

  private processingSyncs = false;
  processPendingSyncs() {
    if (this.processingSyncs) return;

    this.processingSyncs = true;

    queueMicrotask(() => {
      const firstContentPieceMap = new Map<RawCoID, NewContentMessage>();

      while (this.queue.head) {
        const content = this.queue.head.value;

        const firstContentPiece = firstContentPieceMap.get(content.id);

        if (!firstContentPiece) {
          firstContentPieceMap.set(content.id, content);
        } else {
          // There is already a content piece for this coValue, so this means that we need to flag
          // that this content is going to be streamed
          if (!firstContentPiece.expectContentUntil) {
            firstContentPiece.expectContentUntil =
              knownStateFromContent(firstContentPiece).sessions;
          }

          combineKnownStateSessions(
            firstContentPiece.expectContentUntil,
            knownStateFromContent(content).sessions,
          );
        }

        this.sync(content);

        this.queue.shift();
      }

      this.processingSyncs = false;
    });
  }
}
