import {
  Account,
  AnonymousJazzAgent,
  AnyCoSchema,
  InstanceOrPrimitiveOfSchemaCoValuesNullable,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SchemaUnion,
  SubscribeListenerOptions,
} from "../../../internal.js";
import { z } from "../zodReExport.js";

export type AnyDiscriminableCoSchema = AnyCoSchema &
  z.core.$ZodTypeDiscriminable;

export type AnyCoDiscriminatedUnionSchema<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
> = z.ZodDiscriminatedUnion<Types> & {
  collaborative: true;
};

export type CoDiscriminatedUnionSchema<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
> = AnyCoDiscriminatedUnionSchema<Types> & {
  load<
    const R extends RefsToResolve<
      CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion
    > = true,
  >(
    id: string,
    options?: {
      resolve?: RefsToResolveStrict<
        CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion,
        R
      >;
      loadAs?: Account | AnonymousJazzAgent;
      skipRetry?: boolean;
    },
  ): Promise<Resolved<
    CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion,
    R
  > | null>;

  subscribe<
    const R extends RefsToResolve<
      CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion
    > = true,
  >(
    id: string,
    options: SubscribeListenerOptions<
      CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion,
      R
    >,
    listener: (
      value: Resolved<
        CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion,
        R
      >,
      unsubscribe: () => void,
    ) => void,
  ): () => void;

  getCoValueClass: () => typeof SchemaUnion;
};

export function enrichCoDiscriminatedUnionSchema<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
>(
  schema: z.ZodDiscriminatedUnion<Types>,
  coValueClass: typeof SchemaUnion,
): CoDiscriminatedUnionSchema<Types> {
  return Object.assign(schema, {
    load: (...args: [any, ...any]) => {
      // @ts-expect-error
      return coValueClass.load(...args);
    },
    subscribe: (...args: [any, ...any[]]) => {
      // @ts-expect-error
      return coValueClass.subscribe(...args);
    },
    getCoValueClass: () => {
      return coValueClass;
    },
  }) as unknown as CoDiscriminatedUnionSchema<Types>;
}

type CoDiscriminatedUnionInstanceCoValuesNullable<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
> = NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<Types[number]>>;
