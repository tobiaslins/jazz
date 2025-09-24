import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Account, Group } from "jazz-tools";
import {
  JazzWebhook,
  WebhookRegistry,
  JazzWebhookOptions,
  WebhookRegistration,
} from "./webhook.js";

export interface WebhookServiceOptions extends JazzWebhookOptions {
  /** Port to run the service on (default: 3000) */
  port?: number;
  /** Host to bind the service to (default: "localhost") */
  host?: string;
  /** Enable CORS for all origins (default: true) */
  enableCors?: boolean;
  /** API key for authentication (optional) */
  apiKey?: string;
}

export interface RegisterWebhookRequest {
  callback: string;
  coValueId: string;
}

export interface RegisterWebhookResponse {
  webhookId: string;
  message: string;
}

export interface WebhookInfo {
  id: string;
  callback: string;
  coValueId: string;
  active: boolean;
  lastSuccessfulEmit: string;
}

export interface ListWebhooksResponse {
  webhooks: WebhookInfo[];
  count: number;
}

export interface WebhookServiceResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

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

  // API key authentication middleware (if provided)
  if (options.apiKey) {
    app.use("/api/*", async (c, next) => {
      const apiKey =
        c.req.header("Authorization")?.replace("Bearer ", "") ||
        c.req.header("X-API-Key");

      if (!apiKey || apiKey !== options.apiKey) {
        return c.json(
          {
            success: false,
            error: "Invalid or missing API key",
          },
          401,
        );
      }

      await next();
    });
  }

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
        return c.json(
          {
            success: false,
            error: `Webhook with ID ${webhookId} not found`,
          },
          404,
        );
      }

      const webhookInfo: WebhookInfo = {
        id: webhookRegistration.$jazz.id,
        callback: webhookRegistration.callback,
        coValueId: webhookRegistration.coValueId,
        active: webhookRegistration.active,
        lastSuccessfulEmit: webhookRegistration.lastSuccessfulEmit.v,
      };

      return c.json({
        success: true,
        data: webhookInfo,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        500,
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
        return c.json(
          {
            success: false,
            error: "Missing required fields: callback and coValueId",
          },
          400,
        );
      }

      const webhookId = webhook.register(body.callback, body.coValueId);

      const response: RegisterWebhookResponse = {
        webhookId,
        message: "Webhook registered successfully",
      };

      return c.json(
        {
          success: true,
          data: response,
        },
        201,
      );
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        400,
      );
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

      return c.json({
        success: true,
        message: "Webhook unregistered successfully",
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        404,
      );
    }
  });

  /**
   * GET /health
   * Health check endpoint
   */
  app.get("/health", (c) => {
    return c.json({
      success: true,
      message: "Webhook service is running",
      data: {
        timestamp: new Date().toISOString(),
        webhookCount: Object.keys(webhook.registry).length,
        activeWebhookCount: Object.values(webhook.registry).filter(
          (w) => w.active,
        ).length,
      },
    });
  });

  return app;
}
