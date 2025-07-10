import { SchemaUnion } from "../../../internal.js";
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
  getCoSchema: () => typeof SchemaUnion;
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
    getCoSchema: () => {
      return coValueClass;
    },
  }) as unknown as CoDiscriminatedUnionSchema<Types>;
}
