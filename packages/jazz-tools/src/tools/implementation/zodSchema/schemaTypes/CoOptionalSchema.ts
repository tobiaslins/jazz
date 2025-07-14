import { isAnyCoValueSchema } from "../runtimeConverters/zodSchemaToCoSchema.js";
import { z } from "../zodReExport.js";
import {
  AnyCoSchema,
  AnyZodOrCoValueSchema,
  CoValueSchemaFromZodSchema,
} from "../zodSchema.js";

export type AnyCoOptionalSchema<Shape extends z.core.$ZodType = z.core.$ZodType> =
  z.ZodOptional<Shape> & {
    collaborative: true;
    getZodSchema: () => z.ZodOptional<Shape>;
  };

export type CoOptionalSchema<Shape extends AnyCoSchema = AnyCoSchema> =
  AnyCoOptionalSchema<Shape> & {
    getCoValueClass: () => CoValueSchemaFromZodSchema<Shape>["getCoValueClass"];
  };

export function createCoOptionalSchema<T extends AnyCoSchema>(
  schema: T,
): CoOptionalSchema<T> {
  const zodSchema = z.optional(schema);
  return Object.assign(zodSchema, {
    collaborative: true,
    getCoValueClass: () => {
      return (
        schema as CoValueSchemaFromZodSchema<AnyCoSchema>
      ).getCoValueClass();
    },
    getZodSchema: () => zodSchema,
  }) as unknown as CoOptionalSchema<T>;
}

export function isAnyCoOptionalSchema(
  schema: AnyZodOrCoValueSchema,
): schema is CoOptionalSchema<AnyCoSchema> {
  return isAnyCoValueSchema(schema) && schema._zod.def.type === "optional";
}
