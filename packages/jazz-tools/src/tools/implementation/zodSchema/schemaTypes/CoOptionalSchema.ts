import { z } from "../zodReExport.js";
import {
  AnyCoreCoValueSchema,
  CoValueSchemaFromCoreSchema,
} from "../zodSchema.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

export interface CoreCoOptionalSchema<
  Shape extends z.core.$ZodType & CoreCoValueSchema = z.core.$ZodType &
    CoreCoValueSchema,
> extends CoreCoValueSchema,
    z.ZodOptional<Shape> {
  builtin: "CoOptional";
  getZodSchema: () => z.ZodOptional<Shape>;
}

export interface CoOptionalSchema<
  Shape extends z.core.$ZodType & CoreCoValueSchema = z.core.$ZodType &
    CoreCoValueSchema,
> extends CoreCoOptionalSchema<Shape> {
  getCoValueClass: () => CoValueSchemaFromCoreSchema<Shape>["getCoValueClass"];
}

export function createCoOptionalSchema<T extends AnyCoreCoValueSchema>(
  schema: T,
): CoOptionalSchema<T> {
  const zodSchema = z.optional(schema);
  return Object.assign(zodSchema, {
    collaborative: true,
    builtin: "CoOptional" as const,
    getCoValueClass: () => {
      return (
        schema as CoValueSchemaFromCoreSchema<AnyCoreCoValueSchema>
      ).getCoValueClass();
    },
    getZodSchema: () => zodSchema,
  }) as unknown as CoOptionalSchema<T>;
}
