/**
 * Comprehensive type definitions for Jazz Webhook service
 */

// Request types
export interface WebhookServiceOptions {
  /** Port to run the service on (default: 3000) */
  port?: number;
  /** Host to bind the service to (default: "localhost") */
  host?: string;
  /** Enable CORS for all origins (default: true) */
  enableCors?: boolean;
  /** Maximum number of retry attempts for failed webhooks (default: 5) */
  maxRetries?: number;
}

export interface RegisterWebhookRequest {
  callback: string;
  coValueId: string;
}

// Data types
export interface WebhookInfo {
  id: string;
  callback: string;
  coValueId: string;
  active: boolean;
  lastSuccessfulEmit: string;
}

export interface RegisterWebhookResponse {
  webhookId: string;
  message: string;
}

// Test server types
export interface WebhookTestResponse {
  statusCode: number;
  body?: string;
  delay?: number;
}

/**
 * Consolidated interface for all webhook service response types
 */
export interface WebhookServiceResponses {
  // Success responses
  RegisterWebhookSuccess: {
    success: true;
    data: RegisterWebhookResponse;
  };

  WebhookInfoSuccess: {
    success: true;
    data: WebhookInfo;
  };

  HealthCheckSuccess: {
    success: true;
    message: string;
    data: {
      timestamp: string;
      webhookCount: number;
    };
  };

  DeleteWebhookSuccess: {
    success: true;
    message: string;
  };

  // Error responses
  WebhookNotFoundError: {
    success: false;
    error: string;
  };

  ValidationError: {
    success: false;
    error: string;
  };

  InternalServerError: {
    success: false;
    error: string;
  };

  // Generic error response
  GenericError: {
    success: false;
    error: string;
  };
}

/**
 * Union type of all possible webhook service responses
 */
export type WebhookServiceResponse =
  | WebhookServiceResponses["RegisterWebhookSuccess"]
  | WebhookServiceResponses["WebhookInfoSuccess"]
  | WebhookServiceResponses["HealthCheckSuccess"]
  | WebhookServiceResponses["DeleteWebhookSuccess"]
  | WebhookServiceResponses["WebhookNotFoundError"]
  | WebhookServiceResponses["ValidationError"]
  | WebhookServiceResponses["InternalServerError"]
  | WebhookServiceResponses["GenericError"];

/**
 * HTTP status codes used by the webhook service
 */
export enum WebhookServiceStatusCodes {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Type guard functions for response types
 */
export const isSuccessResponse = (
  response: WebhookServiceResponse,
): response is
  | WebhookServiceResponses["RegisterWebhookSuccess"]
  | WebhookServiceResponses["WebhookInfoSuccess"]
  | WebhookServiceResponses["HealthCheckSuccess"]
  | WebhookServiceResponses["DeleteWebhookSuccess"] => {
  return response.success === true;
};

export const isErrorResponse = (
  response: WebhookServiceResponse,
): response is
  | WebhookServiceResponses["WebhookNotFoundError"]
  | WebhookServiceResponses["ValidationError"]
  | WebhookServiceResponses["InternalServerError"]
  | WebhookServiceResponses["GenericError"] => {
  return response.success === false;
};

/**
 * Specific type guards for different response types
 */
export const isRegisterWebhookSuccess = (
  response: WebhookServiceResponse,
): response is WebhookServiceResponses["RegisterWebhookSuccess"] => {
  return (
    response.success === true &&
    "data" in response &&
    "webhookId" in response.data
  );
};

export const isWebhookInfoSuccess = (
  response: WebhookServiceResponse,
): response is WebhookServiceResponses["WebhookInfoSuccess"] => {
  return (
    response.success === true &&
    "data" in response &&
    "id" in response.data &&
    "callback" in response.data
  );
};

export const isHealthCheckSuccess = (
  response: WebhookServiceResponse,
): response is WebhookServiceResponses["HealthCheckSuccess"] => {
  return (
    response.success === true &&
    "message" in response &&
    "data" in response &&
    "timestamp" in response.data
  );
};

export const isDeleteWebhookSuccess = (
  response: WebhookServiceResponse,
): response is WebhookServiceResponses["DeleteWebhookSuccess"] => {
  return (
    response.success === true && "message" in response && !("data" in response)
  );
};

export const isWebhookNotFoundError = (
  response: WebhookServiceResponse,
): response is WebhookServiceResponses["WebhookNotFoundError"] => {
  return (
    response.success === false &&
    "error" in response &&
    response.error.includes("not found")
  );
};

export const isValidationError = (
  response: WebhookServiceResponse,
): response is WebhookServiceResponses["ValidationError"] => {
  return (
    response.success === false &&
    "error" in response &&
    (response.error.includes("Missing required fields") ||
      response.error.includes("Invalid callback URL"))
  );
};
