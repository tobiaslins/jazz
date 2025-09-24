import { describe, expect, test, beforeEach } from "vitest";
import { createJazzTestAccount } from "jazz-tools/testing";
import { startWebhookService } from "../service.js";
import { JazzWebhook } from "../webhook.js";

describe("WebhookService", () => {
  let service: ReturnType<typeof startWebhookService>;
  ("");
  let webhook: JazzWebhook;

  beforeEach(async () => {
    const account = await createJazzTestAccount();
    webhook = new JazzWebhook(JazzWebhook.createRegistry(account));
    service = startWebhookService(webhook);
  });

  test("should have health endpoint", async () => {
    const req = new Request("http://localhost:3000/health");
    const res = await service.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Webhook service is running");
  });

  test("should register a webhook", async () => {
    const webhookData = {
      callback: "https://example.com/webhook",
      coValueId: "co_z1234567890abcdef",
    };

    const req = new Request("http://localhost:3000/api/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    });

    const res = await service.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.webhookId).toBeDefined();
    expect(data.data.message).toBe("Webhook registered successfully");
  });

  test("should reject invalid webhook registration", async () => {
    const invalidData = {
      callback: "not-a-url",
      coValueId: "invalid-id",
    };

    const req = new Request("http://localhost:3000/api/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invalidData),
    });

    const res = await service.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Invalid callback URL");
  });

  test("should reject missing required fields", async () => {
    const incompleteData = {
      callback: "https://example.com/webhook",
      // missing coValueId
    };

    const req = new Request("http://localhost:3000/api/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(incompleteData),
    });

    const res = await service.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Missing required fields");
  });
});
