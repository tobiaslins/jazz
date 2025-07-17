import {
  Account,
  AnonymousJazzAgent,
  InstanceOfSchema,
  InstanceOrPrimitiveOfSchemaCoValuesNullable,
  Resolved,
  SchemaUnion,
  SchemaUnionConcreteSubclass,
  SubscribeListenerOptions,
} from "../../../internal.js";
import { z } from "../zodReExport.js";
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

export type DiscriminableCoValueSchemas = DiscriminableCoreCoValueSchema[];

export interface CoreCoDiscriminatedUnionSchema<
  Options extends DiscriminableCoValueSchemas = DiscriminableCoValueSchemas,
> extends DiscriminableCoreCoValueSchema {
  builtin: "CoDiscriminatedUnion";
  getDefinition: () => CoDiscriminatedUnionSchemaDefinition<Options>;
  getZodSchema: () => z.core.$ZodDiscriminatedUnion<
    ReturnType<Options[number]["getZodSchema"]>[]
  >;
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
    getZodSchema: () => zodSchema,
  });
}

export function enrichCoDiscriminatedUnionSchema<
  Options extends DiscriminableCoValueSchemas,
>(
  schema: CoreCoDiscriminatedUnionSchema<Options>,
  coValueClass: SchemaUnionConcreteSubclass<InstanceOfSchema<Options[number]>>,
): CoDiscriminatedUnionSchema<Options> {
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
  }) as unknown as CoDiscriminatedUnionSchema<Options>;
}

type CoDiscriminatedUnionInstanceCoValuesNullable<
  Options extends DiscriminableCoValueSchemas,
> = NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<Options[number]>>;
