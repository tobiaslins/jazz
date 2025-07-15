import { CoValueCore, CojsonInternalTypes, cojsonInternals } from "cojson";
import z from "zod/v4";
import {
  AnyCoMapSchema,
  AnyCoSchema,
  CoMapInitZod,
  CoMapSchema,
  CoValue,
  CoValueClass,
  Group,
  Loaded,
  ResolveQuery,
  ResolveQueryStrict,
  Simplify,
  anySchemaToCoSchema,
  coMapDefiner,
  exportCoValue,
  importContentPieces,
  loadCoValue,
} from "../internal.js";
import { Account } from "./account.js";

type MessageShape = Record<string, z.core.$ZodType | AnyCoSchema>;

type RequestSchemaDefinition<
  S extends MessageShape,
  R extends ResolveQuery<CoMapSchema<S>> = true,
> =
  | S
  | {
      schema: S;
      resolve?: R;
    };

interface RequestOptions<
  RequestShape extends MessageShape,
  RequestResolve extends ResolveQuery<CoMapSchema<RequestShape>>,
  ResponseShape extends MessageShape,
  ResponseResolve extends ResolveQuery<CoMapSchema<ResponseShape>>,
> {
  url: string;
  workerId: string;
  request: RequestSchemaDefinition<
    RequestShape,
    ResolveQueryStrict<CoMapSchema<RequestShape>, RequestResolve>
  >;
  response: RequestSchemaDefinition<
    ResponseShape,
    ResolveQueryStrict<CoMapSchema<ResponseShape>, ResponseResolve>
  >;
}

type MessageValuePayload<T extends MessageShape> = Simplify<CoMapInitZod<T>>;

function inputValueToCoMap<S extends MessageShape>(
  schema: AnyCoMapSchema,
  value: MessageValuePayload<S>,
  owner: Account,
  sharedWith: Account | Group,
) {
  const group = Group.create({ owner });

  group.addMember(sharedWith, "reader");

  return (schema as CoMapSchema<S>).create(value, group) as Loaded<
    CoMapSchema<S>
  >;
}

async function serializeMessagePayload(
  // Skipping type validation here to avoid excessive type complexity that affects the typecheck performance
  schema: AnyCoMapSchema,
  resolve: any,
  value: any,
  owner: Account,
  target: Account | Group,
) {
  const me = owner ?? Account.getMe();
  const node = me._raw.core.node;
  const crypto = node.crypto;

  const agent = node.getCurrentAgent();
  const signerID = agent.currentSignerID();
  const signerSecret = agent.currentSignerSecret();

  const coMap = inputValueToCoMap(schema, value, me, target);

  const contentPieces = await exportCoValue(schema, coMap.id, {
    resolve,
    loadAs: me,
    bestEffortResolution: true,
  });

  if (!contentPieces) {
    throw new Error(`Failed to export value`);
  }

  if (!contentPieces.some((piece) => piece.id === me.id)) {
    const accountContent = await exportCoValue(Account, me.id, {
      loadAs: me,
    });

    if (!accountContent) {
      throw new Error(`Failed to export current account`);
    }

    for (const piece of accountContent) {
      contentPieces.push(piece);
    }
  }

  const createdAt = Date.now();

  const signPayload = crypto.secureHash({
    contentPieces,
    id: coMap.id,
    createdAt,
  });

  const authToken = crypto.sign(signerSecret, signPayload);

  return {
    contentPieces,
    id: coMap.id,
    createdAt,
    authToken,
    signerID,
  };
}

const requestSchema = z.object({
  contentPieces: z.array(z.json()),
  id: z.custom<`co_z${string}`>(
    (value) => typeof value === "string" && value.startsWith("co_z"),
  ),
  createdAt: z.number(),
  authToken: z.custom<`signature_z${string}`>(
    (value) => typeof value === "string" && value.startsWith("signature_z"),
  ),
  signerID: z.custom<`signer_z${string}`>(
    (value) => typeof value === "string" && value.startsWith("signer_z"),
  ),
});

async function handleIncomingMessage(
  // Skipping type validation here to avoid excessive type complexity that affects the typecheck performance
  schema: AnyCoMapSchema,
  resolve: any,
  request: unknown,
  loadAs: Account,
  handledMessages: Set<`co_z${string}`>,
) {
  const node = loadAs._raw.core.node;
  const crypto = node.crypto;

  const requestParsed = requestSchema.parse(request);

  if (handledMessages.has(requestParsed.id)) {
    throw new Error("Request payload is already handled");
  }

  if (requestParsed.createdAt + 1000 * 60 < Date.now()) {
    throw new Error("Authentication token is expired");
  }

  const signPayload = crypto.secureHash({
    contentPieces: requestParsed.contentPieces,
    id: requestParsed.id,
    createdAt: requestParsed.createdAt,
  });

  if (
    !crypto.verify(requestParsed.authToken, signPayload, requestParsed.signerID)
  ) {
    throw new Error("Invalid signature");
  }

  handledMessages.add(requestParsed.id);

  importContentPieces(
    requestParsed.contentPieces as CojsonInternalTypes.NewContentMessage[],
    loadAs,
  );

  const coValue = await node.loadCoValueCore(requestParsed.id);
  const accountId = getCoValueCreatorAccountId(coValue);

  const madeBy = await Account.load(accountId, {
    loadAs,
  });

  if (!madeBy) {
    throw new Error("Made by account not found");
  }

  const signerID = crypto.getAgentSignerID(madeBy._raw.currentAgentID());

  if (signerID !== requestParsed.signerID) {
    throw new Error(
      "The signer ID in the request does not match the signer ID of the account",
    );
  }

  const coSchema = anySchemaToCoSchema(schema) as CoValueClass<CoValue>;
  const value = await loadCoValue(coSchema, requestParsed.id, {
    resolve,
    loadAs,
  });

  if (!value) {
    throw new Error("Value not found");
  }

  return {
    value: value as unknown,
    madeBy,
  };
}

function parseSchemaAndResolve<
  S extends MessageShape,
  R extends ResolveQuery<CoMapSchema<S>>,
>(options: RequestSchemaDefinition<S, R>) {
  if ("schema" in options) {
    return {
      // Casting to reduce the type complexity
      schema: coMapDefiner(options.schema) as AnyCoMapSchema,
      resolve: options.resolve as any,
    };
  }

  return {
    schema: coMapDefiner(options) as AnyCoMapSchema,
    resolve: true as any,
  };
}

class HttpRoute<
  RequestShape extends MessageShape = z.core.$ZodLooseShape,
  RequestResolve extends ResolveQuery<CoMapSchema<RequestShape>> = any,
  ResponseShape extends MessageShape = z.core.$ZodLooseShape,
  ResponseResolve extends ResolveQuery<CoMapSchema<ResponseShape>> = any,
> {
  private processedValues = new Set<`co_z${string}`>();
  private requestDefinition: {
    schema: AnyCoMapSchema;
    resolve: any;
  };
  private responseDefinition: {
    schema: AnyCoMapSchema;
    resolve: any;
  };
  private url: string;
  private workerId: string;

  constructor(
    params: RequestOptions<
      RequestShape,
      RequestResolve,
      ResponseShape,
      ResponseResolve
    >,
  ) {
    this.requestDefinition = parseSchemaAndResolve(params.request);
    this.responseDefinition = parseSchemaAndResolve(params.response);
    this.url = params.url;
    this.workerId = params.workerId;
  }

  send = async (
    values: MessageValuePayload<RequestShape>,
    options?: { owner?: Account },
  ): Promise<Loaded<CoMapSchema<ResponseShape>, ResponseResolve>> => {
    const as = options?.owner ?? Account.getMe();

    const workerAccount = await Account.load(this.workerId, {
      loadAs: as,
    });

    if (!workerAccount) {
      throw new Error("Worker account not found");
    }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        await serializeMessagePayload(
          this.requestDefinition.schema,
          this.requestDefinition.resolve,
          values,
          as,
          workerAccount,
        ),
      ),
    });

    const responseBody = await response.json();

    const responseParsed = z
      .object({
        type: z.literal("success"),
        payload: z.any(),
      })
      .parse(responseBody);

    const data = await handleIncomingMessage(
      this.responseDefinition.schema,
      this.responseDefinition.resolve,
      responseParsed.payload,
      as,
      this.processedValues,
    );

    return data.value as Loaded<CoMapSchema<ResponseShape>, ResponseResolve>;
  };

  handle = async (
    request: Request,
    as: Account,
    callback: (
      value: Loaded<CoMapSchema<RequestShape>, RequestResolve>,
      madeBy: Account,
    ) =>
      | Promise<MessageValuePayload<ResponseShape>>
      | MessageValuePayload<ResponseShape>,
  ): Promise<Response> => {
    const node = as._raw.core.node;
    const body = await request.json();
    const data = await handleIncomingMessage(
      this.requestDefinition.schema,
      this.requestDefinition.resolve,
      body,
      as,
      this.processedValues,
    );

    const tracking = node.syncManager.trackDirtyCoValues();

    const responseValue = await callback(
      data.value as Loaded<CoMapSchema<RequestShape>, RequestResolve>,
      data.madeBy,
    );

    const responsePayload = await serializeMessagePayload(
      this.responseDefinition.schema,
      this.responseDefinition.resolve,
      responseValue,
      as,
      data.madeBy,
    );

    const responseBody = JSON.stringify({
      type: "success",
      payload: responsePayload,
    });

    // TODO: Detect the defer support from the environment
    await Promise.all(
      Array.from(tracking.done(), (id) => node.syncManager.waitForSync(id)),
    );

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  get requestSchema(): CoMapSchema<RequestShape> {
    return this.requestDefinition.schema as CoMapSchema<RequestShape>;
  }

  get responseSchema() {
    return this.responseDefinition.schema as CoMapSchema<ResponseShape>;
  }
}

export function experimental_defineRequest<
  RequestShape extends MessageShape,
  RequestResolve extends ResolveQuery<CoMapSchema<RequestShape>>,
  ResponseShape extends MessageShape,
  ResponseResolve extends ResolveQuery<CoMapSchema<ResponseShape>>,
>(
  params: RequestOptions<
    RequestShape,
    RequestResolve,
    ResponseShape,
    ResponseResolve
  >,
) {
  return new HttpRoute(params);
}

function getCoValueCreatorAccountId(coValue: CoValueCore) {
  if (!coValue.isAvailable()) {
    throw new Error("Unable to load the request payload");
  }

  const creatorSessionId = coValue.getValidSortedTransactions().at(0)
    ?.txID.sessionID;

  if (!creatorSessionId) {
    throw new Error("Request payload is not valid");
  }

  const accountId =
    cojsonInternals.accountOrAgentIDfromSessionID(creatorSessionId);

  if (!accountId.startsWith("co_z")) {
    throw new Error("Request payload is not valid");
  }

  return accountId;
}
