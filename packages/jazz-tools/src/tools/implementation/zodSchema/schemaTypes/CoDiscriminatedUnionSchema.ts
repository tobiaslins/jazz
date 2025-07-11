import {
  Account,
  AnonymousJazzAgent,
  InstanceOrPrimitiveOfSchemaCoValuesNullable,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SchemaUnion,
} from "../../../internal.js";
import { z } from "../zodReExport.js";

export type AnyCoDiscriminatedUnionSchema<
  Types extends readonly [
    z.core.$ZodTypeDiscriminable,
    ...z.core.$ZodTypeDiscriminable[],
  ],
> = z.ZodDiscriminatedUnion<Types> & {
  collaborative: true;
};

export type CoDiscriminatedUnionSchema<
  Types extends readonly [
    z.core.$ZodTypeDiscriminable,
    ...z.core.$ZodTypeDiscriminable[],
  ],
> = AnyCoDiscriminatedUnionSchema<Types> & {
  load<
    const R extends RefsToResolve<
      CoDiscriminatedUnionInstanceCoValuesNullable<Types>
    > = true,
  >(
    id: string,
    options?: {
      resolve?: RefsToResolveStrict<
        CoDiscriminatedUnionInstanceCoValuesNullable<Types>,
        R
      >;
      loadAs?: Account | AnonymousJazzAgent;
      skipRetry?: boolean;
    },
  ): Promise<Resolved<
    CoDiscriminatedUnionInstanceCoValuesNullable<Types>,
    R
  > | null>;
  getCoValueClass: () => typeof SchemaUnion;
};

export function enrichCoDiscriminatedUnionSchema<
  Types extends readonly [
    z.core.$ZodTypeDiscriminable,
    ...z.core.$ZodTypeDiscriminable[],
  ],
>(
  schema: z.ZodDiscriminatedUnion<Types>,
  coValueClass: typeof SchemaUnion,
): CoDiscriminatedUnionSchema<Types> {
  return Object.assign(schema, {
    load: (...args: [any, ...any]) => {
      // @ts-expect-error TODO check
      return coValueClass.load(...args);
    },
    getCoValueClass: () => {
      return coValueClass;
    },
  }) as unknown as CoDiscriminatedUnionSchema<Types>;
}

type CoDiscriminatedUnionInstanceCoValuesNullable<
  Types extends readonly [
    z.core.$ZodTypeDiscriminable,
    ...z.core.$ZodTypeDiscriminable[],
  ],
> = NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<Types[number]>>;
