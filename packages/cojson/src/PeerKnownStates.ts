import { RawCoID, SessionID } from "./ids.js";
import {
  cloneKnownState,
  combineKnownStates,
  CoValueKnownState,
  emptyKnownState,
  updateSessionCounter,
} from "./knownState.js";

export class PeerKnownStates {
  private coValues = new Map<RawCoID, CoValueKnownState>();

  getKnownState(id: RawCoID) {
    const knownState = this.coValues.get(id);

    if (!knownState) {
      const knownState = emptyKnownState(id);
      this.coValues.set(id, knownState);
      return knownState;
    }

    return knownState;
  }

  updateHeader(id: RawCoID, header: boolean) {
    const knownState = this.getKnownState(id);
    knownState.header = header;
    this.triggerUpdate(id, knownState);
  }

  combineWith(id: RawCoID, value: CoValueKnownState) {
    const knownState = this.getKnownState(id);
    combineKnownStates(knownState, value);
    this.triggerUpdate(id, knownState);
  }

  updateSessionCounter(id: RawCoID, sessionId: SessionID, value: number) {
    const knownState = this.getKnownState(id);
    updateSessionCounter(knownState.sessions, sessionId, value);

    this.triggerUpdate(id, knownState);
  }

  set(id: RawCoID, payload: CoValueKnownState | "empty") {
    const knownState =
      payload === "empty" ? emptyKnownState(id) : cloneKnownState(payload);
    this.coValues.set(id, knownState);
    this.triggerUpdate(id, knownState);
  }

  get(id: RawCoID) {
    return this.coValues.get(id);
  }

  has(id: RawCoID) {
    return this.coValues.has(id);
  }

  clone() {
    const clone = new PeerKnownStates();

    for (const [id, knownState] of this.coValues) {
      clone.coValues.set(id, cloneKnownState(knownState));
    }

    return clone;
  }

  listeners = new Set<(id: RawCoID, knownState: CoValueKnownState) => void>();

  private triggerUpdate(id: RawCoID, knownState: CoValueKnownState) {
    this.trigger(id, knownState);
  }

  private trigger(id: RawCoID, knownState: CoValueKnownState) {
    for (const listener of this.listeners) {
      listener(id, knownState);
    }
  }

  subscribe(listener: (id: RawCoID, knownState: CoValueKnownState) => void) {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }
}

export type ReadonlyPeerKnownStates = Pick<
  PeerKnownStates,
  "get" | "has" | "clone" | "subscribe"
>;
