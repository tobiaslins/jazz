import { describe, expect, test, vi } from "vitest";
import { PeerState } from "../PeerState.js";
import { ConnectedPeerChannel } from "../streamUtils.js";
import { Peer, SyncMessage } from "../sync.js";
import { CoValueKnownState, KnownStateSessions } from "../knownState.js";

function setup() {
  const mockPeer: Peer = {
    id: "test-peer",
    role: "client",
    priority: 1,
    incoming: new ConnectedPeerChannel(),
    outgoing: new ConnectedPeerChannel(),
  };
  vi.spyOn(mockPeer.outgoing, "push");
  vi.spyOn(mockPeer.incoming, "close");
  vi.spyOn(mockPeer.outgoing, "close");
  const peerState = new PeerState(mockPeer, undefined);
  return { mockPeer, peerState };
}

describe("PeerState", () => {
  test("should push outgoing message to peer", async () => {
    const { mockPeer, peerState } = setup();
    const message: SyncMessage = {
      action: "load",
      id: "co_ztest-id",
      header: false,
      sessions: {},
    };
    await peerState.pushOutgoingMessage(message);
    expect(mockPeer.outgoing.push).toHaveBeenCalledWith(message);
  });

  test("should return peer's incoming when not closed", () => {
    const { mockPeer, peerState } = setup();
    expect(peerState.incoming).toBe(mockPeer.incoming);
  });

  test("should perform graceful shutdown", () => {
    const { mockPeer, peerState } = setup();
    peerState.gracefulShutdown();
    expect(mockPeer.outgoing.close).toHaveBeenCalled();
    expect(peerState.closed).toBe(true);
  });

  test("should clone the knownStates into optimisticKnownStates and knownStates when passed as argument", () => {
    const { peerState, mockPeer } = setup();
    peerState.setKnownState("co_z1", {
      id: "co_z1",
      header: false,
      sessions: {},
    });

    const newPeerState = new PeerState(mockPeer, peerState.knownStates);

    expect(newPeerState.knownStates).toEqual(peerState.knownStates);
    expect(newPeerState.optimisticKnownStates).toEqual(peerState.knownStates);
  });

  test("should dispatch to both states", () => {
    const { peerState } = setup();
    const knownStatesSpy = vi.spyOn(peerState._knownStates, "set");

    const optimisticKnownStatesSpy = vi.spyOn(
      peerState._optimisticKnownStates,
      "set",
    );

    const state: CoValueKnownState = {
      id: "co_z1",
      header: false,
      sessions: {},
    };

    peerState.setKnownState("co_z1", state);

    expect(knownStatesSpy).toHaveBeenCalledWith("co_z1", state);
    expect(optimisticKnownStatesSpy).toHaveBeenCalledWith("co_z1", state);
  });

  test("dispatching an optimistic update should not affect the known states", () => {
    const { peerState } = setup();

    const state: CoValueKnownState = {
      id: "co_z1",
      header: false,
      sessions: {},
    };

    peerState.setKnownState("co_z1", state);

    const optimisticState: CoValueKnownState = {
      id: "co_z1",
      header: false,
      sessions: {
        "session-1": 1,
      } as KnownStateSessions,
    };

    peerState.combineOptimisticWith("co_z1", optimisticState);

    expect(peerState.knownStates.get("co_z1")).not.toEqual(optimisticState);
    expect(peerState.optimisticKnownStates.get("co_z1")).toEqual(
      optimisticState,
    );
  });

  test("should use separate references for knownStates and optimisticKnownStates for non-storage peers", () => {
    const { peerState } = setup(); // Uses a regular peer

    // Verify they are different references
    expect(peerState.knownStates).not.toBe(peerState.optimisticKnownStates);
  });
});
