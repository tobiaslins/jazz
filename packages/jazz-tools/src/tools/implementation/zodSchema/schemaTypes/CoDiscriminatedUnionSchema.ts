import {
  Account,
  AnonymousJazzAgent,
  AnyCoreCoValueSchema,
  InstanceOfSchema,
  InstanceOrPrimitiveOfSchemaCoValuesNullable,
  Resolved,
  SchemaUnion,
  SchemaUnionConcreteSubclass,
  SubscribeListenerOptions,
} from "../../../internal.js";
import { z } from "../zodReExport.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

export type AnyDiscriminableCoSchema = AnyCoreCoValueSchema &
  z.core.$ZodTypeDiscriminable;

export type CoDiscriminatedUnionSchemaDefinition = {
  discriminator: string;
  discriminatorMap: z.core.$ZodDiscriminatedUnionInternals["disc"];
  options: AnyDiscriminableCoSchema[];
};

export interface CoreCoDiscriminatedUnionSchema<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
> extends CoreCoValueSchema,
    z.core.$ZodDiscriminatedUnion<Types> {
  builtin: "CoDiscriminatedUnion";
  getDefinition: () => CoDiscriminatedUnionSchemaDefinition;
  getZodSchema: () => z.core.$ZodDiscriminatedUnion<Types>;
}
export interface CoDiscriminatedUnionSchema<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
> extends CoreCoDiscriminatedUnionSchema<Types> {
  load(
    id: string,
    options?: {
      loadAs?: Account | AnonymousJazzAgent;
      skipRetry?: boolean;
    },
  ): Promise<Resolved<
    CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion,
    true
  > | null>;

  subscribe(
    id: string,
    options: SubscribeListenerOptions<
      CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion,
      true
    >,
    listener: (
      value: Resolved<
        CoDiscriminatedUnionInstanceCoValuesNullable<Types> & SchemaUnion,
        true
      >,
      unsubscribe: () => void,
    ) => void,
  ): () => void;

  getCoValueClass: () => SchemaUnionConcreteSubclass<
    InstanceOfSchema<Types[number]>
  >;
}

export function createCoreCoDiscriminatedUnionSchema<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
>(
  discriminator: string,
  schemas: Types,
): CoreCoDiscriminatedUnionSchema<Types> {
  const zodSchema = z.discriminatedUnion(discriminator, schemas as any);
  return Object.assign(zodSchema, {
    collaborative: true as const,
    builtin: "CoDiscriminatedUnion" as const,
    getDefinition: () => ({
      discriminator,
      get discriminatorMap() {
        return zodSchema._zod.disc;
      },
      get options() {
        return zodSchema._zod.def.options;
      },
    }),
    getZodSchema: () => zodSchema,
  });
}

export function enrichCoDiscriminatedUnionSchema<
  Types extends readonly [
    AnyDiscriminableCoSchema,
    ...AnyDiscriminableCoSchema[],
  ],
>(
  schema: z.ZodDiscriminatedUnion<Types>,
  coValueClass: SchemaUnionConcreteSubclass<InstanceOfSchema<Types[number]>>,
): CoDiscriminatedUnionSchema<Types> {
  return Object.assign(schema, {
    load: (...args: [any, ...any]) => {
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
