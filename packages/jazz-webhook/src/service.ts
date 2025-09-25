import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import {
  JazzWebhook,
  JazzWebhookOptions,
  WebhookRegistration,
} from "./webhook.js";
import {
  WebhookServiceOptions,
  RegisterWebhookRequest,
  RegisterWebhookResponse,
  WebhookInfo,
  WebhookServiceResponses,
  WebhookServiceStatusCodes,
} from "./types.js";

export function startWebhookService(
  webhook: JazzWebhook,
  options: WebhookServiceOptions = {},
): Hono {
  const app = new Hono();

  // Middleware
  if (options.enableCors !== false) {
    app.use("*", cors());
  }

  app.use("*", logger());

  /**
   * GET /api/webhooks/:id
   * Get a specific webhook by ID
   */
  app.get("/api/webhooks/:id", async (c) => {
    try {
      const webhookId = c.req.param("id");
      const webhookRegistration = await WebhookRegistration.load(webhookId, {
        resolve: {
          lastSuccessfulEmit: true,
        },
      });

      if (!webhookRegistration) {
        const errorResponse: WebhookServiceResponses["WebhookNotFoundError"] = {
          success: false,
          error: `Webhook with ID ${webhookId} not found`,
        };
        return c.json(errorResponse, WebhookServiceStatusCodes.NOT_FOUND);
      }

      const webhookInfo: WebhookInfo = {
        id: webhookRegistration.$jazz.id,
        callback: webhookRegistration.callback,
        coValueId: webhookRegistration.coValueId,
        active: webhookRegistration.active,
        lastSuccessfulEmit: webhookRegistration.lastSuccessfulEmit.v,
      };

      const successResponse: WebhookServiceResponses["WebhookInfoSuccess"] = {
        success: true,
        data: webhookInfo,
      };

      return c.json(successResponse);
    } catch (error) {
      const errorResponse: WebhookServiceResponses["InternalServerError"] = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      return c.json(
        errorResponse,
        WebhookServiceStatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  });

  /**
   * POST /api/webhooks
   * Register a new webhook
   */
  app.post("/api/webhooks", async (c) => {
    try {
      const body = (await c.req.json()) as RegisterWebhookRequest;

      if (!body.callback || !body.coValueId) {
        const errorResponse: WebhookServiceResponses["ValidationError"] = {
          success: false,
          error: "Missing required fields: callback and coValueId",
        };
        return c.json(errorResponse, WebhookServiceStatusCodes.BAD_REQUEST);
      }

      const webhookId = webhook.register(body.callback, body.coValueId);

      const response: RegisterWebhookResponse = {
        webhookId,
        message: "Webhook registered successfully",
      };

      const successResponse: WebhookServiceResponses["RegisterWebhookSuccess"] =
        {
          success: true,
          data: response,
        };

      return c.json(successResponse, WebhookServiceStatusCodes.CREATED);
    } catch (error) {
      const errorResponse: WebhookServiceResponses["ValidationError"] = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      return c.json(errorResponse, WebhookServiceStatusCodes.BAD_REQUEST);
    }
  });

  /**
   * DELETE /api/webhooks/:id
   * Unregister a webhook
   */
  app.delete("/api/webhooks/:id", (c) => {
    try {
      const webhookId = c.req.param("id");
      webhook.unregister(webhookId);

      const successResponse: WebhookServiceResponses["DeleteWebhookSuccess"] = {
        success: true,
        message: "Webhook unregistered successfully",
      };
      return c.json(successResponse);
    } catch (error) {
      const errorResponse: WebhookServiceResponses["WebhookNotFoundError"] = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
      return c.json(errorResponse, WebhookServiceStatusCodes.NOT_FOUND);
    }
  });

  /**
   * GET /health
   * Health check endpoint
   */
  app.get("/health", (c) => {
    const successResponse: WebhookServiceResponses["HealthCheckSuccess"] = {
      success: true,
      message: "Webhook service is running",
      data: {
        timestamp: new Date().toISOString(),
        webhookCount: Object.keys(webhook.registry).length,
      },
    };

    return c.json(successResponse);
  });

  return app;
}
