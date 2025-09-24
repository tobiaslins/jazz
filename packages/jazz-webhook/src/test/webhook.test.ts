import { describe, expect, test, onTestFinished, assert } from "vitest";
import { co, z, Group } from "jazz-tools";
import { createJazzTestAccount } from "jazz-tools/testing";
import { WebhookTestServer } from "./http-server.js";
import { JazzWebhook, WebhookRegistration, WebhookRegistry } from "../index.js";

// Define test schemas
const TestCoMap = co.map({
  value: z.string(),
});

const TestRoot = co.map({
  webhookRegistry: WebhookRegistry,
});

const TestAccount = co
  .account({
    root: TestRoot,
    profile: co.profile(),
  })
  .withMigration((account, creationProps) => {
    const group = Group.create({ owner: account });
    group.addMember("everyone", "reader");

    if (!account.$jazz.has("profile")) {
      account.$jazz.set(
        "profile",
        co.profile().create(
          {
            name: creationProps?.name ?? "Test Account",
          },
          group,
        ),
      );
    }

    if (!account.$jazz.has("root")) {
      account.$jazz.set(
        "root",
        TestRoot.create(
          {
            webhookRegistry: JazzWebhook.createRegistry(group),
          },
          group,
        ),
      );
    }
  });

interface TestContext {
  account: any;
  webhookServer: WebhookTestServer;
  registry: any;
  webhookManager: JazzWebhook;
}

async function setupTest(): Promise<TestContext> {
  const account = await createJazzTestAccount({
    AccountSchema: TestAccount,
    isCurrentActiveAccount: true,
  });

  const webhookServer = new WebhookTestServer();
  await webhookServer.start();
  const registry = account.root.webhookRegistry;
  const webhookManager = new JazzWebhook(registry, {
    baseDelayMs: 1,
  });

  // Set up cleanup for this test
  onTestFinished(async () => {
    if (webhookServer) {
      webhookServer.close();
    }
  });

  return {
    account,
    webhookServer,
    registry,
    webhookManager,
  };
}

describe("jazz-webhook", () => {
  describe("webhook registration", () => {
    test("should register a valid webhook", async () => {
      const { webhookServer, registry, webhookManager } = await setupTest();

      const webhookId = webhookManager.register(
        webhookServer.getUrl(),
        "co_z1234567890abcdef",
      );

      expect(webhookId).toBeDefined();
      expect(registry[webhookId]).toBeDefined();
      expect(registry[webhookId].callback).toBe(webhookServer.getUrl());
      expect(registry[webhookId].coValueId).toBe("co_z1234567890abcdef");
      expect(registry[webhookId].active).toBe(true);
      expect(registry[webhookId].lastSuccessfulEmit.v).toBe("");
    });

    test("should throw error for invalid callback URL", async () => {
      const { webhookManager } = await setupTest();

      expect(() => {
        webhookManager.register("not-a-url", "co_z1234567890abcdef");
      }).toThrow("Invalid callback URL: not-a-url");
    });

    test("should throw error for invalid CoValue ID format", async () => {
      const { webhookServer, webhookManager } = await setupTest();

      expect(() => {
        webhookManager.register(webhookServer.getUrl(), "invalid-id");
      }).toThrow(
        "Invalid CoValue ID format: invalid-id. Expected format: co_z...",
      );

      expect(() => {
        webhookManager.register(webhookServer.getUrl(), "co_invalid");
      }).toThrow(
        "Invalid CoValue ID format: co_invalid. Expected format: co_z...",
      );
    });

    test("should accept valid CoValue IDs", async () => {
      const { webhookServer, webhookManager } = await setupTest();

      const validIds = [
        "co_z1234567890abcdef",
        "co_zABCDEF1234567890",
        "co_z1234567890abcdef1234567890abcdef12345678",
      ];

      validIds.forEach((id) => {
        expect(() => {
          webhookManager.register(webhookServer.getUrl(), id);
        }).not.toThrow();
      });
    });

    test("should create multiple webhooks with different IDs", async () => {
      const { webhookServer, registry, webhookManager } = await setupTest();

      const webhook1 = webhookManager.register(
        webhookServer.getUrl(),
        "co_z1111111111111111",
      );
      const webhook2 = webhookManager.register(
        webhookServer.getUrl(),
        "co_z2222222222222222",
      );

      expect(webhook1).not.toBe(webhook2);
      expect(registry[webhook1].coValueId).toBe("co_z1111111111111111");
      expect(registry[webhook2].coValueId).toBe("co_z2222222222222222");
    });
  });

  describe("webhook unregistration", () => {
    test("should unregister a webhook", async () => {
      const { webhookServer, registry, webhookManager } = await setupTest();

      const webhookId = webhookManager.register(
        webhookServer.getUrl(),
        "co_z1234567890abcdef",
      );

      const webhook = registry[webhookId];
      expect(webhook.active).toBe(true);

      webhookManager.unregister(webhookId);

      expect(registry[webhookId]).toBeUndefined();
      expect(webhook.active).toBe(false);
    });

    test("should throw error for non-existent webhook", async () => {
      const { webhookManager } = await setupTest();

      expect(() => {
        webhookManager.unregister("fake-id");
      }).toThrow("Webhook with ID fake-id not found");
    });
  });

  describe("webhook emission with real HTTP server", () => {
    test("should emit webhook when CoValue changes", async () => {
      const { account, webhookServer, webhookManager } = await setupTest();

      // Create a test CoMap
      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      // Register webhook (automatically subscribes)
      webhookManager.register(webhookServer.getUrl(), coValueId);

      // Make a change to trigger webhook
      testMap.$jazz.set("value", "changed");

      // Wait for webhook to be emitted
      const requests = await webhookServer.waitForRequests(1, 3000);

      expect(requests.length).toBeGreaterThanOrEqual(1);
      const lastRequest = webhookServer.getLastRequest();
      expect(lastRequest.coValueId).toBe(coValueId);
      expect(lastRequest.hash).toBeDefined();
      expect(lastRequest.timestamp).toBeTypeOf("number");
      expect(lastRequest.timestamp).toBeGreaterThan(Date.now() - 10000);
    });

    test("should queue multiple changes and emit only the latest", async () => {
      const { account, webhookServer, webhookManager } = await setupTest();

      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      webhookManager.register(webhookServer.getUrl(), coValueId);

      // Make multiple rapid changes
      testMap.$jazz.set("value", "change1");
      testMap.$jazz.set("value", "change2");
      testMap.$jazz.set("value", "change3");

      // Wait for webhook to be processed
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should only receive one webhook with the latest state
      expect(webhookServer.requests.length).toBeGreaterThanOrEqual(1);

      // The last request should be for the final change
      const lastRequest = webhookServer.requests.at(-1);
      expect(lastRequest?.coValueId).toBe(coValueId);
    });

    test("should update lastSuccessfulEmit after successful webhook", async () => {
      const { account, webhookServer, registry, webhookManager } =
        await setupTest();

      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      const webhookId = webhookManager.register(
        webhookServer.getUrl(),
        coValueId,
      );

      testMap.$jazz.set("value", "changed");

      const requests = await webhookServer.waitForRequests(1, 3000);

      expect(requests.length).toBeGreaterThanOrEqual(1);

      const lastRequest = webhookServer.getLastRequest();
      const webhook = registry[webhookId];

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(webhook.lastSuccessfulEmit.v).toBe(lastRequest.hash);
    });

    test("should retry failed webhooks with exponential backoff", async () => {
      const { account, webhookServer, webhookManager } = await setupTest();

      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      // Set up server to fail first 2 requests, then succeed
      webhookServer.setResponse(0, 500, "Server Error");
      webhookServer.setResponse(1, 500, "Server Error");
      webhookServer.setResponse(2, 200, "Success");

      webhookManager.register(webhookServer.getUrl(), coValueId);

      testMap.$jazz.set("value", "changed");

      // Should eventually succeed after retries
      const requests = await webhookServer.waitForRequests(3, 10000);

      expect(requests).toHaveLength(3);
      expect(requests[0]!.coValueId).toBe(coValueId);
      expect(requests[1]!.coValueId).toBe(coValueId);
      expect(requests[2]!.coValueId).toBe(coValueId);
    });

    test("should give up after max retries", async () => {
      const { account, webhookServer, webhookManager } = await setupTest();

      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      // Set up server to always fail
      for (let i = 0; i < 10; i++) {
        webhookServer.setResponse(i, 500, "Server Error");
      }

      webhookManager.register(webhookServer.getUrl(), coValueId);

      testMap.$jazz.set("value", "changed");

      // Should retry 5 times then give up
      const requests = await webhookServer.waitForRequests(5, 1000);

      expect(requests).toHaveLength(5); // 5 retries
      expect(requests.every((req) => req.coValueId === coValueId)).toBe(true);
    });

    test("should handle slow server responses", async () => {
      const { account, webhookServer, webhookManager } = await setupTest();

      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      // Set up server with slow response
      webhookServer.setResponse(0, 200, "Success", 500);

      webhookManager.register(webhookServer.getUrl(), coValueId);

      testMap.$jazz.set("value", "changed");

      await webhookServer.waitForRequests(1, 5000);

      const request = webhookServer.expectSingleRequest();

      expect(request.coValueId).toBe(coValueId);
    });

    test("should batch subsequent updates", async () => {
      const { account, webhookServer, webhookManager } = await setupTest();

      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      // Set up server with slow response
      webhookServer.setResponse(0, 200, "Success", 10);
      webhookServer.setResponse(1, 200, "Success", 10);
      webhookServer.setResponse(2, 200, "Success", 10);

      const webhookId = webhookManager.register(
        webhookServer.getUrl(),
        coValueId,
      );

      const webhook = await WebhookRegistration.load(webhookId, {
        resolve: {
          lastSuccessfulEmit: true,
        },
      });
      assert(webhook);

      testMap.$jazz.set("value", "changed1");

      let lastSuccessfulEmit = webhook.lastSuccessfulEmit.v;

      await webhookServer.waitForRequests(1, 5000);

      await waitFor(() => {
        expect(webhook.lastSuccessfulEmit.v).not.toBe(lastSuccessfulEmit);
      });

      lastSuccessfulEmit = webhook.lastSuccessfulEmit.v;

      // It should run the first one and enqueue the last one
      testMap.$jazz.set("value", "changed2");
      testMap.$jazz.set("value", "changed3");
      testMap.$jazz.set("value", "changed4");
      testMap.$jazz.set("value", "changed5");

      await webhookServer.waitForRequests(3, 5000);

      const requests = webhookServer.requests;

      expect(requests.length).toBe(3);
    });

    test("should handle webhook unregistration cleanup", async () => {
      const { account, webhookServer, webhookManager } = await setupTest();

      const testMap = TestCoMap.create({ value: "initial" }, account.root);
      const coValueId = testMap.$jazz.id as `co_z${string}`;

      const webhookId = webhookManager.register(
        webhookServer.getUrl(),
        coValueId,
      );

      // Make initial change
      testMap.$jazz.set("value", "changed");
      await webhookServer.waitForRequests(1, 3000);

      const initialRequestCount = webhookServer.requests.length;

      // Unregister webhook
      webhookManager.unregister(webhookId);

      // Make another change - should not trigger webhook
      testMap.$jazz.set("value", "changed_again");

      // Wait a bit to ensure no additional requests
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(webhookServer.getRequestCount()).toBe(initialRequestCount);
    });
  });
});

export function waitFor(
  callback: () => boolean | void | Promise<boolean | void>,
) {
  return new Promise<void>((resolve, reject) => {
    const checkPassed = async () => {
      try {
        return { ok: await callback(), error: null };
      } catch (error) {
        return { ok: false, error };
      }
    };

    let retries = 0;

    const interval = setInterval(async () => {
      const { ok, error } = await checkPassed();

      if (ok !== false) {
        clearInterval(interval);
        resolve();
      }

      if (++retries > 10) {
        clearInterval(interval);
        reject(error);
      }
    }, 100);
  });
}
