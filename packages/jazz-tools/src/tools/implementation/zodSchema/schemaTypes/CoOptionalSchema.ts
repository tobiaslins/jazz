import { isCoValueSchema } from "../runtimeConverters/zodSchemaToCoSchema.js";
import { z } from "../zodReExport.js";
import { AnyCoSchema } from "../zodSchema.js";

export type AnyCoOptionalSchema<
  Shape extends z.core.$ZodType = z.core.$ZodType,
> = CoOptionalSchema<Shape>;

// TODO the type constraint should eventually be AnyCoSchema
export type CoOptionalSchema<T extends z.core.$ZodType> = z.ZodOptional<T> & {
  collaborative: true;
};

export function createCoOptionalSchema<T extends AnyCoSchema>(
  schema: T,
): CoOptionalSchema<T> {
  return Object.assign(z.optional(schema), { collaborative: true as const });
}

export function isCoOptionalSchema(
  schema: z.core.$ZodType,
): schema is CoOptionalSchema<z.core.$ZodType> {
  return isCoValueSchema(schema) && schema._zod.def.type === "optional";
}
