import { CojsonInternalTypes, CryptoProvider, JsonValue } from "cojson";
import z from "zod/v4";
import {
  AnyCoSchema,
  CoValue,
  CoValueClass,
  Loaded,
  ResolveQuery,
  ResolveQueryStrict,
  anySchemaToCoSchema,
  exportCoValue,
  importContentPieces,
  loadCoValue,
} from "../internal.js";
import { Account } from "./account.js";

type RequestSchemaDefinition<
  S extends AnyCoSchema,
  R extends ResolveQuery<S> = true,
> =
  | S
  | {
      schema: S;
      resolve?: R;
    };

interface RequestOptions<
  RequestSchema extends AnyCoSchema,
  RequestResolve extends ResolveQuery<RequestSchema>,
  ResponseSchema extends AnyCoSchema,
  ResponseResolve extends ResolveQuery<ResponseSchema>,
> {
  url: string;
  // TODO: The request payload should be optional
  request: RequestSchemaDefinition<
    RequestSchema,
    ResolveQueryStrict<RequestSchema, RequestResolve>
  >;
  response: RequestSchemaDefinition<
    ResponseSchema,
    ResolveQueryStrict<ResponseSchema, ResponseResolve>
  >;
}

async function serializeMessagePayload(
  // Skipping type validation here to avoid excessive type complexity that affects the typecheck performance
  schema: AnyCoSchema,
  resolve: any,
  value: any,
  owner?: Account,
) {
  const me = owner ?? Account.getMe();
  const node = me._raw.core.node;
  const agent = node.getCurrentAgent();
  const signerID = agent.currentSignerID();
  const signerSecret = agent.currentSignerSecret();

  const contentPieces = await exportCoValue(schema, value.id, {
    resolve,
    loadAs: me,
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

  // TODO: Replay attacks protection
  const challenge = node.crypto.uniquenessForHeader();
  const signature = node.crypto.sign(signerSecret, `${value.id}${challenge}`);

  return {
    contentPieces,
    challenge,
    id: value.id,
    madeBy: me.id,
    signerID,
    signature,
  };
}

const requestSchema = z.object({
  contentPieces: z.array(z.json()),
  id: z.string(),
  challenge: z.string(),
  madeBy: z.string(),
  signerID: z.string(),
  signature: z.string(),
});

async function handleIncomingMessage(
  // Skipping type validation here to avoid excessive type complexity that affects the typecheck performance
  schema: AnyCoSchema,
  resolve: any,
  request: unknown,
  crypto: CryptoProvider,
  loadAs?: Account,
) {
  const requestParsed = requestSchema.parse(request);

  if (
    !crypto.verify(
      requestParsed.signature as CojsonInternalTypes.Signature,
      `${requestParsed.id}${requestParsed.challenge}`,
      requestParsed.signerID as CojsonInternalTypes.SignerID,
    )
  ) {
    throw new Error("Invalid signature");
  }

  importContentPieces(
    requestParsed.contentPieces as CojsonInternalTypes.NewContentMessage[],
    loadAs,
  );

  const madeBy = await Account.load(requestParsed.madeBy, {
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
    loadAs: loadAs ?? Account.getMe(),
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
  S extends AnyCoSchema,
  R extends ResolveQuery<S>,
>(options: RequestSchemaDefinition<S, R>) {
  if ("schema" in options) {
    return {
      schema: options.schema,
      resolve: options.resolve,
    };
  }

  return {
    schema: options,
    resolve: true,
  };
}

export function experimental_defineRequest<
  RequestSchema extends AnyCoSchema,
  RequestResolve extends ResolveQuery<RequestSchema>,
  ResponseSchema extends AnyCoSchema,
  ResponseResolve extends ResolveQuery<ResponseSchema>,
>(
  params: RequestOptions<
    RequestSchema,
    RequestResolve,
    ResponseSchema,
    ResponseResolve
  >,
) {
  const requestDefinition = parseSchemaAndResolve(params.request);
  const responseDefinition = parseSchemaAndResolve(params.response);

  const send = async (
    // TODO: Accept the init payload as well
    values: Loaded<RequestSchema>,
    options?: { owner?: Account },
  ): Promise<Loaded<ResponseSchema, ResponseResolve>> => {
    const as = options?.owner ?? Account.getMe();
    const node = as._raw.core.node;

    const response = await fetch(params.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        await serializeMessagePayload(
          requestDefinition.schema,
          requestDefinition.resolve,
          values,
          as,
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
      responseDefinition.schema,
      responseDefinition.resolve,
      responseParsed.payload,
      node.crypto,
      as,
    );

    return data.value as Loaded<ResponseSchema, ResponseResolve>;
  };

  const handle = async (
    request: Request,
    as: Account,
    callback: (
      value: Loaded<RequestSchema, RequestResolve>,
      madeBy: Account,

      // TODO: Accept the init payload as well
    ) => Promise<Loaded<ResponseSchema>> | Loaded<ResponseSchema>,
  ): Promise<Response> => {
    const node = as._raw.core.node;
    const body = await request.json();
    const data = await handleIncomingMessage(
      requestDefinition.schema,
      requestDefinition.resolve,
      body,
      node.crypto,
      as,
    );

    const responseValue = await callback(
      data.value as Loaded<RequestSchema, RequestResolve>,
      data.madeBy,
    );

    const responsePayload = await serializeMessagePayload(
      responseDefinition.schema,
      responseDefinition.resolve,
      responseValue,
      as,
    );

    const responseBody = JSON.stringify({
      type: "success",
      payload: responsePayload,
    });

    return new Response(responseBody, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  return {
    send,
    handle,
    schema: {
      request: requestDefinition.schema,
      response: responseDefinition.schema,
    },
  };
}
