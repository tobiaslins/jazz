// @vitest-environment happy-dom

import { createWebSocketPeer } from "cojson-transport-ws";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createWebSocketPeerWithReconnection } from "../createWebSocketPeerWithReconnection.js";

// Mock WebSocket
class MockWebSocket {
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
  close = vi.fn();
  readyState = 1;
}

vi.stubGlobal("WebSocket", MockWebSocket);
vi.stubGlobal("window", global);
vi.stubGlobal("navigator", {
  onLine: true,
});

vi.mock("cojson-transport-ws", () => ({
  createWebSocketPeer: vi.fn().mockImplementation(({ onClose }) => ({
    id: "test-peer",
    incoming: { push: vi.fn() },
    outgoing: { push: vi.fn(), close: vi.fn() },
    onClose,
  })),
}));

describe("createWebSocketPeerWithReconnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("WebSocket", MockWebSocket);
    vi.stubGlobal("removeEventListener", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should reset reconnection timeout when coming online", async () => {
    vi.useFakeTimers();
    const addPeerMock = vi.fn();
    const removePeerMock = vi.fn();

    const connection = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      500,
      addPeerMock,
      removePeerMock,
    );
    connection.enable();

    // Simulate multiple disconnections to increase timeout
    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;
    initialPeer.onClose();

    await vi.advanceTimersByTimeAsync(1000);

    expect(addPeerMock).toHaveBeenCalledTimes(2);

    vi.mocked(createWebSocketPeer).mock.results[1]!.value.onClose();
    await vi.advanceTimersByTimeAsync(2000);

    expect(addPeerMock).toHaveBeenCalledTimes(3);

    // Resets the timeout to initial value
    window.dispatchEvent(new Event("online"));

    // Next reconnection should use initial timeout
    vi.mocked(createWebSocketPeer).mock.results[2]!.value.onClose();
    await vi.advanceTimersByTimeAsync(1000);

    expect(addPeerMock).toHaveBeenCalledTimes(4);

    connection.disable();
  });

  test("should wait for online event or timeout before reconnecting", async () => {
    vi.useFakeTimers();

    const addPeerMock = vi.fn();
    const removePeerMock = vi.fn();
    const connection = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      500,
      addPeerMock,
      removePeerMock,
    );
    connection.enable();

    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;

    // Simulate offline state
    vi.stubGlobal("navigator", { onLine: false });

    initialPeer.onClose();

    // Advance timer but not enough to trigger reconnection
    await vi.advanceTimersByTimeAsync(500);
    expect(createWebSocketPeer).toHaveBeenCalledTimes(1);

    // Simulate coming back online
    window.dispatchEvent(new Event("online"));

    // Wait for event loop to settle
    await Promise.resolve().then();

    // Should reconnect immediately after coming online
    expect(createWebSocketPeer).toHaveBeenCalledTimes(2);

    connection.disable();
  });

  test("should clean up event listeners when disabled", () => {
    const addPeerMock = vi.fn();
    const removePeerMock = vi.fn();
    const connection = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      1000,
      addPeerMock,
      removePeerMock,
    );
    connection.enable();
    connection.disable();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "online",
      expect.any(Function),
    );
  });

  test("should not attempt reconnection after disable is called", async () => {
    vi.useFakeTimers();

    const addPeerMock = vi.fn();
    const removePeerMock = vi.fn();
    const connection = createWebSocketPeerWithReconnection(
      "ws://localhost:8080",
      500,
      addPeerMock,
      removePeerMock,
    );
    connection.enable();

    const initialPeer = vi.mocked(createWebSocketPeer).mock.results[0]!.value;

    connection.disable();

    initialPeer.onClose();
    await vi.advanceTimersByTimeAsync(1000);

    expect(createWebSocketPeer).toHaveBeenCalledTimes(1);
  });
});
