import { ValueType } from "@opentelemetry/api";
import { UpDownCounter, metrics } from "@opentelemetry/api";
import { PeerState } from "./PeerState.js";
import { CoValueCore, TryAddTransactionsError } from "./coValueCore.js";
import { RawCoID } from "./ids.js";
import { logger } from "./logger.js";
import { PeerID, emptyKnownState } from "./sync.js";

export const CO_VALUE_LOADING_CONFIG = {
  MAX_RETRIES: 2,
  TIMEOUT: 30_000,
};

export class CoValueState {
  private peers = new Map<
    PeerID,
    | { type: "unknown" | "pending" | "available" | "unavailable" }
    | { type: "errored"; error: TryAddTransactionsError }
  >();

  core: CoValueCore | null = null;
  id: RawCoID;

  listeners: Set<(state: CoValueState) => void> = new Set();

  constructor(id: RawCoID) {
    this.id = id;
  }

  addListener(listener: (state: CoValueState) => void) {
    this.listeners.add(listener);
    listener(this);
  }

  removeListener(listener: (state: CoValueState) => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  async getCoValue() {
    if (this.isDefinitelyUnavailable()) {
      return "unavailable";
    }

    return new Promise<CoValueCore>((resolve) => {
      const listener = (state: CoValueState) => {
        if (state.core) {
          resolve(state.core);
          this.removeListener(listener);
        }
      };

      this.addListener(listener);
    });
  }

  async loadFromPeers(peers: PeerState[]) {
    const loadAttempt = async (peersToLoadFrom: PeerState[]) => {
      const peersToActuallyLoadFrom = [];
      for (const peer of peersToLoadFrom) {
        const currentState = this.peers.get(peer.id);

        if (currentState?.type === "available") {
          continue;
        }

        if (currentState?.type === "errored") {
          continue;
        }

        if (currentState?.type === "pending") {
          continue;
        }

        if (currentState?.type === "unavailable") {
          if (peer.shouldRetryUnavailableCoValues()) {
            this.peers.set(peer.id, { type: "pending" });
            peersToActuallyLoadFrom.push(peer);
          }

          continue;
        }

        if (!currentState || currentState?.type === "unknown") {
          this.peers.set(peer.id, { type: "pending" });
          peersToActuallyLoadFrom.push(peer);
        }
      }

      for (const peer of peersToActuallyLoadFrom) {
        peer
          .pushOutgoingMessage({
            action: "load",
            ...(this.core ? this.core.knownState() : emptyKnownState(this.id)),
          })
          .catch((err) => {
            logger.warn(`Failed to push load message to peer ${peer.id}`, {
              err,
            });
          });

        const waitingForPeer = new Promise<void>((resolve) => {
          const listener = (state: CoValueState) => {
            const peerState = state.peers.get(peer.id);
            if (
              state.isAvailable() ||
              peerState?.type === "errored" ||
              peerState?.type === "unavailable"
            ) {
              resolve();
              state.removeListener(listener);
            }
          };

          this.addListener(listener);
        });

        /**
         * Use a very long timeout for storage peers, because under pressure
         * they may take a long time to consume the messages queue
         *
         * TODO: Track errors on storage and do not rely on timeout
         */
        const timeoutDuration =
          peer.role === "storage"
            ? CO_VALUE_LOADING_CONFIG.TIMEOUT * 10
            : CO_VALUE_LOADING_CONFIG.TIMEOUT;

        await Promise.race([waitingForPeer, sleep(timeoutDuration)]);
      }
    };

    await loadAttempt(peers);

    // Retry loading from peers that have the retry flag enabled
    const peersWithRetry = peers.filter((p) =>
      p.shouldRetryUnavailableCoValues(),
    );

    if (peersWithRetry.length > 0) {
      // We want to exit early if the coValue becomes available in between the retries
      await Promise.race([
        this.getCoValue(), // TODO: avoid leaving hanging promise?
        runWithRetry(
          () => loadAttempt(peersWithRetry),
          CO_VALUE_LOADING_CONFIG.MAX_RETRIES,
        ),
      ]);
    }
  }

  markNotFoundInPeer(peerId: PeerID) {
    this.peers.set(peerId, { type: "unavailable" });
    this.notifyListeners();
  }

  markAvailable(coValue: CoValueCore) {
    this.core = coValue;
    this.notifyListeners();
  }

  markErrored(peerId: PeerID, error: TryAddTransactionsError) {
    this.peers.set(peerId, { type: "errored", error });
    this.notifyListeners();
  }

  isErroredInPeer(peerId: PeerID) {
    return this.peers.get(peerId)?.type === "errored";
  }

  isAvailable(): this is { type: "available"; core: CoValueCore } {
    return !!this.core;
  }

  isUnknown() {
    return (
      this.peers.values().every((p) => p.type === "unknown") &&
      !this.isAvailable()
    );
  }

  isLoading() {
    return this.peers.values().some((p) => p.type === "pending");
  }

  isDefinitelyUnavailable() {
    return (
      this.peers
        .values()
        .every((p) => p.type === "unavailable" || p.type === "errored") &&
      !this.isAvailable()
    );
  }
}

async function runWithRetry<T>(fn: () => Promise<T>, maxRetries: number) {
  let retries = 1;

  while (retries < maxRetries) {
    /**
     * With maxRetries of 5 we should wait:
     * 300ms
     * 900ms
     * 2700ms
     * 8100ms
     */
    await sleep(3 ** retries * 100);

    const result = await fn();

    if (result === true) {
      return;
    }

    retries++;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
