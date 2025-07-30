import type { SessionID, SyncMessage } from "cojson";
import { type Mocked, afterEach, describe, expect, test, vi } from "vitest";
import { BatchedOutgoingMessages } from "../BatchedOutgoingMessages";
import type { AnyWebSocket } from "../types";
import { createTestMetricReader, tearDownTestMetricReader } from "./utils.js";

describe("BatchedOutgoingMessages", () => {
  describe("telemetry", () => {
    afterEach(() => {
      tearDownTestMetricReader();
    });

    test("should correctly measure egress", async () => {
      const metricReader = createTestMetricReader();

      const mockWebSocket = {
        readyState: 1,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        close: vi.fn(),
        send: vi.fn(),
      } as unknown as Mocked<AnyWebSocket>;

      const outgoing = new BatchedOutgoingMessages(
        mockWebSocket,
        true,
        "server",
        { test: "test" },
      );

      const sessionID = "co_zsomething_session_zlow" as SessionID;
      const encryptedChanges = "encrypted_U123" as const;
      const messageWithPrivateTransactions: SyncMessage = {
        action: "content",
        id: "co_zsomeid",
        new: {
          [sessionID]: {
            after: 0,
            newTransactions: [
              {
                privacy: "private" as const,
                madeAt: 0,
                keyUsed: "key_zkey" as const,
                encryptedChanges,
              },
            ],
            lastSignature: "signature_1",
          },
        },
        priority: 6,
      };

      vi.useFakeTimers();
      outgoing.push(messageWithPrivateTransactions);

      await vi.runAllTimersAsync();
      vi.useRealTimers();

      expect(
        await metricReader.getMetricValue("jazz.usage.egress", {
          test: "test",
        }),
      ).toBe(encryptedChanges.length);

      const trustingChanges = "Hello, world!";
      const messageWithTrustingTransactions: SyncMessage = {
        action: "content",
        id: "co_zsomeid",
        new: {
          [sessionID]: {
            after: 0,
            newTransactions: [
              {
                privacy: "trusting" as const,
                madeAt: 0,
                changes: trustingChanges,
              },
            ],
            lastSignature: "signature_1",
          },
        },
        priority: 6,
      };

      vi.useFakeTimers();
      outgoing.push(messageWithTrustingTransactions);

      await vi.runAllTimersAsync();
      vi.useRealTimers();

      expect(
        await metricReader.getMetricValue("jazz.usage.egress", {
          test: "test",
        }),
      ).toBe(encryptedChanges.length + trustingChanges.length);
    });
  });
});
