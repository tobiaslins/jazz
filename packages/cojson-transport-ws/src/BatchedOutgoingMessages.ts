import type { SyncMessage } from "cojson";
import { addMessageToBacklog } from "./serialization.js";

export const MAX_OUTGOING_MESSAGES_CHUNK_BYTES = 25_000;

export class BatchedOutgoingMessages {
  private backlog = "";
  private timeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private send: (messages: string) => void) {}

  push(msg: SyncMessage) {
    const payload = addMessageToBacklog(this.backlog, msg);

    const maxChunkSizeReached =
      payload.length >= MAX_OUTGOING_MESSAGES_CHUNK_BYTES;
    const backlogExists = this.backlog.length > 0;

    if (maxChunkSizeReached && backlogExists) {
      this.sendMessagesInBulk();
      this.backlog = addMessageToBacklog("", msg);
    } else if (maxChunkSizeReached) {
      this.backlog = payload;
      this.sendMessagesInBulk();
    } else {
      this.backlog = payload;
    }

    // Throttling the sending of messages to once every 10ms
    if (!this.timeout) {
      this.timeout = setTimeout(() => {
        this.sendMessagesInBulk();
        this.timeout = null;
      }, 10);
    }
  }

  sendMessagesInBulk() {
    if (this.backlog.length > 0) {
      this.send(this.backlog);
      this.backlog = "";
    }
  }

  close() {
    this.sendMessagesInBulk();
  }
}
