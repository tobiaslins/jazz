import { describe, expect, test, beforeEach } from "vitest";
import { createJazzTestAccount } from "jazz-tools/testing";
import { startWebhookService } from "../service.js";
import { JazzWebhook } from "../webhook.js";
import {
  WebhookServiceResponses,
  WebhookServiceResponse,
  isHealthCheckSuccess,
  isRegisterWebhookSuccess,
  isValidationError,
  isWebhookInfoSuccess,
  isWebhookNotFoundError,
  isDeleteWebhookSuccess,
} from "../types.js";

describe("WebhookService", () => {
  let service: ReturnType<typeof startWebhookService>;
  let webhook: JazzWebhook;

  beforeEach(async () => {
    const account = await createJazzTestAccount();
    webhook = new JazzWebhook(JazzWebhook.createRegistry(account));
    service = startWebhookService(webhook);
  });

  test("should have health endpoint", async () => {
    const req = new Request("http://localhost:3000/health");
    const res = await service.fetch(req);
    const data = (await res.json()) as WebhookServiceResponse;

    expect(res.status).toBe(200);
    expect(isHealthCheckSuccess(data)).toBe(true);
    if (isHealthCheckSuccess(data)) {
      expect(data.success).toBe(true);
      expect(data.message).toBe("Webhook service is running");
      expect(data.data.timestamp).toBeDefined();
      expect(typeof data.data.webhookCount).toBe("number");
    }
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
    const data = (await res.json()) as WebhookServiceResponse;

    expect(res.status).toBe(201);
    expect(isRegisterWebhookSuccess(data)).toBe(true);
    if (isRegisterWebhookSuccess(data)) {
      expect(data.success).toBe(true);
      expect(data.data.webhookId).toBeDefined();
      expect(data.data.message).toBe("Webhook registered successfully");
    }
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
    const data = (await res.json()) as WebhookServiceResponse;

    expect(res.status).toBe(400);
    expect(isValidationError(data)).toBe(true);
    if (isValidationError(data)) {
      expect(data.success).toBe(false);
      expect(data.error).toContain("Invalid callback URL");
    }
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
    const data = (await res.json()) as WebhookServiceResponse;

    expect(res.status).toBe(400);
    expect(isValidationError(data)).toBe(true);
    if (isValidationError(data)) {
      expect(data.success).toBe(false);
      expect(data.error).toContain("Missing required fields");
    }
  });

  test("should get specific webhook by ID", async () => {
    // First register a webhook
    const webhookData = {
      callback: "https://example.com/webhook",
      coValueId: "co_z1234567890abcdef",
    };

    const registerReq = new Request("http://localhost:3000/api/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    });

    const registerRes = await service.fetch(registerReq);
    const registerData = (await registerRes.json()) as WebhookServiceResponse;

    let webhookId: string;
    if (isRegisterWebhookSuccess(registerData)) {
      webhookId = registerData.data.webhookId;
    } else {
      throw new Error("Failed to register webhook for test");
    }

    // Then get the specific webhook
    const getReq = new Request(
      `http://localhost:3000/api/webhooks/${webhookId}`,
    );
    const res = await service.fetch(getReq);
    const data = (await res.json()) as WebhookServiceResponse;

    expect(res.status).toBe(200);
    expect(isWebhookInfoSuccess(data)).toBe(true);
    if (isWebhookInfoSuccess(data)) {
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(webhookId);
      expect(data.data.callback).toBe(webhookData.callback);
      expect(data.data.coValueId).toBe(webhookData.coValueId);
    }
  });

  test("should return 404 for non-existent webhook", async () => {
    const req = new Request(
      "http://localhost:3000/api/webhooks/non-existent-id",
    );
    const res = await service.fetch(req);
    const data = (await res.json()) as WebhookServiceResponse;

    expect(res.status).toBe(404);
    expect(isWebhookNotFoundError(data)).toBe(true);
    if (isWebhookNotFoundError(data)) {
      expect(data.success).toBe(false);
      expect(data.error).toContain("not found");
    }
  });

  test("should delete a webhook", async () => {
    // First register a webhook
    const webhookData = {
      callback: "https://example.com/webhook",
      coValueId: "co_z1234567890abcdef",
    };

    const registerReq = new Request("http://localhost:3000/api/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookData),
    });

    const registerRes = await service.fetch(registerReq);
    const registerData = (await registerRes.json()) as WebhookServiceResponse;

    let webhookId: string;
    if (isRegisterWebhookSuccess(registerData)) {
      webhookId = registerData.data.webhookId;
    } else {
      throw new Error("Failed to register webhook for test");
    }

    // Then delete the webhook
    const deleteReq = new Request(
      `http://localhost:3000/api/webhooks/${webhookId}`,
      {
        method: "DELETE",
      },
    );
    const res = await service.fetch(deleteReq);
    const data = (await res.json()) as WebhookServiceResponse;

    expect(res.status).toBe(200);
    expect(isDeleteWebhookSuccess(data)).toBe(true);
    if (isDeleteWebhookSuccess(data)) {
      expect(data.success).toBe(true);
      expect(data.message).toContain("unregistered successfully");
    }
  });
});
