import { CojsonInternalTypes, CryptoProvider, JsonValue } from "cojson";
import z from "zod/v4";
import {
  CoValue,
  CoValueClass,
  CoValueOrZodSchema,
  Loaded,
  ResolveQuery,
  anySchemaToCoSchema,
  exportCoValue,
  importContentPieces,
  loadCoValue,
} from "../internal.js";
import { Account } from "./account.js";

type CoValueKnownState = CojsonInternalTypes.CoValueKnownState;
type NonCoZodType = z.ZodType & { collaborative?: false };

interface RequestPayloadValue<
  S extends CoValueOrZodSchema,
  R extends ResolveQuery<S>,
> {
  schema: S;
  resolve?: R;
}

type BaseRequestPayload = Record<
  string,
  | RequestPayloadValue<CoValueOrZodSchema, ResolveQuery<CoValueOrZodSchema>>
  | NonCoZodType
>;

interface RequestOptions<
  P extends BaseRequestPayload,
  R extends BaseRequestPayload,
> {
  url: string;
  payload: P;
  response: R;
}

export type ValueSchemas = Record<string, CoValueOrZodSchema>;

type LooseValuesFor<P extends BaseRequestPayload> = {
  [K in keyof P]: any;
};

export type InputValuesFor<P extends BaseRequestPayload> = {
  [K in keyof P]: P[K] extends { schema: any }
    ? Loaded<P[K]["schema"]>
    : P[K] extends z.core.$ZodType
      ? z.infer<P[K]>
      : never;
};

export type LoadedValuesFor<P extends BaseRequestPayload> = {
  [K in keyof P]: P[K] extends { schema: any; resolve?: any }
    ? P[K]["resolve"] extends ResolveQuery<P[K]["schema"]>
      ? Loaded<P[K]["schema"], P[K]["resolve"]>
      : Loaded<P[K]["schema"]>
    : P[K] extends z.core.$ZodType
      ? z.infer<P[K]>
      : never;
};

export type PlainDataFor<P extends BaseRequestPayload> = {
  [K in keyof P]: P[K] extends z.core.$ZodType ? z.infer<P[K]> : never;
};

export type CoValueRequest<Vs extends ValueSchemas, P extends z.ZodType> = {
  payload: {
    values: Record<keyof Vs, string>;
    params: z.infer<P>;
  };
  madeBy: string;
  signerID: CojsonInternalTypes.SignerID;
  signature: CojsonInternalTypes.Signature;
  knownStates?: Record<string, CoValueKnownState>;
  contentPieces?: Record<string, CojsonInternalTypes.NewContentMessage>;
};

async function serializeMessagePayload<P extends BaseRequestPayload>(
  values: LooseValuesFor<P>,
  params: P,
  owner?: Account,
) {
  const me = owner ?? Account.getMe();
  const node = me._raw.core.node;
  const agent = node.getCurrentAgent();
  const signerID = agent.currentSignerID();
  const signerSecret = agent.currentSignerSecret();

  const coValuesIds: [string, string][] = [];
  const plainData: Record<string, unknown> = {};
  const contentPieces: CojsonInternalTypes.NewContentMessage[] = [];

  for (const k of Object.keys(params)) {
    const schemaDef = params[k];

    if (!schemaDef) {
      continue;
    }

    if ("schema" in schemaDef) {
      const value = values[k];

      if (!value) {
        throw new Error(`Value ${k} not found in values`);
      }

      coValuesIds.push([k, value.id]);

      // TODO: Deduplicate content pieces
      const coSchema = anySchemaToCoSchema(schemaDef.schema);
      const exported = await exportCoValue(coSchema, value.id, {
        resolve: schemaDef.resolve,
        loadAs: me,
      });

      if (!exported) {
        throw new Error(`Failed to export value ${k}`);
      }

      for (const piece of exported) {
        contentPieces.push(piece);
      }
    } else {
      plainData[k] = schemaDef.parse(values[k]);
    }
  }

  const exported = await exportCoValue(Account, me.id, {
    loadAs: me,
  });

  if (!exported) {
    throw new Error(`Failed to export current account`);
  }

  for (const piece of exported) {
    contentPieces.push(piece);
  }

  const payload = {
    coValuesIds,
    contentPieces,
    plainData,
  };

  const stringifiedPayload = JSON.stringify(payload);
  const hash = node.crypto.secureHash(stringifiedPayload);
  const signature = node.crypto.sign(signerSecret, hash);

  return {
    payload: stringifiedPayload,
    madeBy: me.id,
    signerID,
    signature,
  };
}

const requestSchema = z.object({
  payload: z.string(),
  madeBy: z.string(),
  signerID: z.string(),
  signature: z.string(),
});

const requestPayloadSchema = z.object({
  coValuesIds: z.array(z.tuple([z.string(), z.string()])),
  plainData: z.any(),
  // TODO Setup a proper content schema for this
  contentPieces: z.array(z.json()),
});

function parsePlainData<P extends BaseRequestPayload>(
  params: P,
  payload: unknown,
) {
  const shape: Record<string, NonCoZodType> = {};

  for (const k of Object.keys(params)) {
    const schemaDef = params[k];

    if (!schemaDef) {
      continue;
    }

    if ("schema" in schemaDef) {
      continue;
    }

    shape[k] = schemaDef;
  }

  return z.object(shape).parse(payload) as PlainDataFor<P>;
}

async function handleIncomingMessage<P extends BaseRequestPayload>(
  request: unknown,
  paramsSchema: P,
  crypto: CryptoProvider,
  loadAs?: Account,
) {
  const requestParsed = requestSchema.parse(request);

  const hash = crypto.secureHash(requestParsed.payload);

  if (
    !crypto.verify(
      requestParsed.signature as CojsonInternalTypes.Signature,
      hash,
      requestParsed.signerID as CojsonInternalTypes.SignerID,
    )
  ) {
    throw new Error("Invalid signature");
  }

  const payload = requestPayloadSchema.parse(JSON.parse(requestParsed.payload));

  importContentPieces(
    payload.contentPieces as CojsonInternalTypes.NewContentMessage[],
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

  const coValuesIds = payload.coValuesIds;
  const plainData = parsePlainData(paramsSchema, payload.plainData);

  const values = await loadValues(coValuesIds, plainData, paramsSchema, loadAs);

  return {
    values,
    madeBy,
  };
}

async function loadValues<P extends BaseRequestPayload>(
  coValuesIds: [string, string][],
  plainData: PlainDataFor<P>,
  params: P,
  loadAs?: Account,
) {
  const loaded = plainData as LoadedValuesFor<P>;
  const promises = [];
  const errors: string[] = [];

  for (const [k, id] of coValuesIds) {
    const schemaDef = params[k];

    if (!schemaDef || !("schema" in schemaDef)) {
      throw new Error(`Value ${k} not found in valueSchemas`);
    }

    const coSchema = anySchemaToCoSchema(schemaDef.schema);

    promises.push(
      loadCoValue(coSchema, id, {
        // @ts-expect-error We can't really validate this
        resolve: schemaDef.resolve,
        loadAs: loadAs ?? Account.getMe(),
      }).then((v: unknown) => {
        if (!v) {
          errors.push(`Value ${k} not found/accessible`);
        }

        // @ts-expect-error We can't really validate this
        loaded[k] = v;

        return v;
      }),
    );
  }

  await Promise.all(promises);

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return loaded;
}

export function experimental_defineRequest<
  P extends BaseRequestPayload,
  R extends BaseRequestPayload,
>(params: RequestOptions<P, R>) {
  const send = async (
    values: InputValuesFor<P>,
    options?: { owner?: Account },
  ) => {
    const as = options?.owner ?? Account.getMe();
    const node = as._raw.core.node;

    const response = await fetch(params.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        await serializeMessagePayload(values, params.payload, as),
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
      responseParsed.payload,
      params.response,
      node.crypto,
      as,
    );

    return data.values;
  };

  const handle = async (
    request: Request,
    as: Account,
    callback: (
      values: LoadedValuesFor<P>,
      madeBy: Account,
    ) => Promise<LoadedValuesFor<R>>,
  ): Promise<Response> => {
    const node = as._raw.core.node;
    const body = await request.json();
    const data = await handleIncomingMessage(
      body,
      params.payload,
      node.crypto,
      as,
    );

    const responseValues = await callback(data.values, data.madeBy);

    const responsePayload = await serializeMessagePayload(
      responseValues as InputValuesFor<R>,
      params.response,
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
  };
}
