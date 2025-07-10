import { isCoValueSchema } from "../runtimeConverters/zodSchemaToCoSchema.js";
import { z } from "../zodReExport.js";
import { AnyCoSchema } from "../zodSchema.js";

export type AnyCoOptionalSchema<Shape extends z.core.$ZodType = z.core.$ZodType> =
  z.ZodOptional<Shape> & {
    collaborative: true;
  };

export type CoOptionalSchema<Shape extends z.core.$ZodType = z.core.$ZodType> =
  AnyCoOptionalSchema<Shape>;

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
