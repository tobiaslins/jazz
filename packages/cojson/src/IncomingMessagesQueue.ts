import type { PeerState } from "./PeerState.js";
import { LinkedList } from "./PriorityBasedMessageQueue.js";
import { logger } from "./logger.js";
import type { SyncMessage } from "./sync.js";

export class IncomingMessagesQueue {
  queues: [LinkedList<SyncMessage>, PeerState][];
  peerToQueue: WeakMap<PeerState, LinkedList<SyncMessage>>;
  currentQueue = 0;

  constructor() {
    this.queues = [];
    this.peerToQueue = new WeakMap();
  }

  public push(msg: SyncMessage, peer: PeerState) {
    const queue = this.peerToQueue.get(peer);

    if (!queue) {
      const newQueue = new LinkedList<SyncMessage>();
      this.peerToQueue.set(peer, newQueue);
      this.queues.push([newQueue, peer]);
      newQueue.push(msg);
    } else {
      queue.push(msg);
    }
  }

  public pull() {
    const entry = this.queues[this.currentQueue];

    if (!entry) {
      return undefined;
    }

    const [queue, peer] = entry;
    const msg = queue.shift();

    if (queue.isEmpty()) {
      this.queues.splice(this.currentQueue, 1);
      this.peerToQueue.delete(peer);
    } else {
      this.currentQueue++;
    }

    if (this.currentQueue >= this.queues.length) {
      this.currentQueue = 0;
    }

    if (msg) {
      return { msg, peer };
    }

    return undefined;
  }

  processing = false;

  async processQueue(callback: (msg: SyncMessage, peer: PeerState) => void) {
    this.processing = true;

    let entry: { msg: SyncMessage; peer: PeerState } | undefined;
    let lastTimer = performance.now();

    while ((entry = this.pull())) {
      const { msg, peer } = entry;

      try {
        callback(msg, peer);
      } catch (err) {
        logger.error("Error processing message", { err });
      }

      const currentTimer = performance.now();

      // We check if we have blocked the main thread for too long
      // and if so, we schedule a timer task to yield to the event loop
      if (currentTimer - lastTimer > 50) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    this.processing = false;
  }
}
