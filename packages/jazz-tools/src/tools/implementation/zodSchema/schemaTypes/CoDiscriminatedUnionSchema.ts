import {
  Account,
  AnonymousJazzAgent,
  InstanceOfSchema,
  InstanceOrPrimitiveOfSchemaCoValuesNullable,
  Resolved,
  SchemaUnion,
  SchemaUnionConcreteSubclass,
  SubscribeListenerOptions,
  coOptionalDefiner,
} from "../../../internal.js";
import { z } from "../zodReExport.js";
import { CoOptionalSchema } from "./CoOptionalSchema.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

export interface DiscriminableCoreCoValueSchema extends CoreCoValueSchema {
  discriminable: true;
}

export interface CoDiscriminatedUnionSchemaDefinition<
  Options extends DiscriminableCoValueSchemas,
> {
  discriminator: string;
  discriminatorMap: z.core.$ZodDiscriminatedUnionInternals["propValues"];
  options: Options;
}

export type DiscriminableCoValueSchemas = [
  DiscriminableCoreCoValueSchema,
  ...DiscriminableCoreCoValueSchema[],
];

export interface CoreCoDiscriminatedUnionSchema<
  Options extends DiscriminableCoValueSchemas = DiscriminableCoValueSchemas,
> extends DiscriminableCoreCoValueSchema {
  builtin: "CoDiscriminatedUnion";
  getDefinition: () => CoDiscriminatedUnionSchemaDefinition<Options>;
}
export interface CoDiscriminatedUnionSchema<
  Options extends DiscriminableCoValueSchemas,
> extends CoreCoDiscriminatedUnionSchema<Options> {
  load(
    id: string,
    options?: {
      loadAs?: Account | AnonymousJazzAgent;
      skipRetry?: boolean;
    },
  ): Promise<Resolved<
    CoDiscriminatedUnionInstanceCoValuesNullable<Options> & SchemaUnion,
    true
  > | null>;

  subscribe(
    id: string,
    options: SubscribeListenerOptions<
      CoDiscriminatedUnionInstanceCoValuesNullable<Options> & SchemaUnion,
      true
    >,
    listener: (
      value: Resolved<
        CoDiscriminatedUnionInstanceCoValuesNullable<Options> & SchemaUnion,
        true
      >,
      unsubscribe: () => void,
    ) => void,
  ): () => void;

  getCoValueClass: () => SchemaUnionConcreteSubclass<
    InstanceOfSchema<Options[number]>
  >;

  optional(): CoOptionalSchema<CoDiscriminatedUnionSchema<Options>>;
}

export function createCoreCoDiscriminatedUnionSchema<
  Options extends DiscriminableCoValueSchemas,
>(
  discriminator: string,
  schemas: Options,
): CoreCoDiscriminatedUnionSchema<Options> {
  const zodSchema = z.discriminatedUnion(discriminator, schemas as any);
  return Object.assign(zodSchema, {
    collaborative: true as const,
    builtin: "CoDiscriminatedUnion" as const,
    discriminable: true as const,
    getDefinition: () => ({
      discriminator,
      get discriminatorMap() {
        return zodSchema._zod.propValues;
      },
      get options() {
        return zodSchema._zod.def.options;
      },
    }),
  });
}

export function enrichCoDiscriminatedUnionSchema<
  Options extends DiscriminableCoValueSchemas,
>(
  schema: CoreCoDiscriminatedUnionSchema<Options>,
  coValueClass: SchemaUnionConcreteSubclass<InstanceOfSchema<Options[number]>>,
): CoDiscriminatedUnionSchema<Options> {
  const coValueSchema = Object.assign(schema, {
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

    optional: () => {
      return coOptionalDefiner(coValueSchema);
    },
  }) as unknown as CoDiscriminatedUnionSchema<Options>;
  return coValueSchema;
}

type CoDiscriminatedUnionInstanceCoValuesNullable<
  Options extends DiscriminableCoValueSchemas,
> = NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<Options[number]>>;
