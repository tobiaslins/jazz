import { z } from "../zodReExport.js";
import { CoValueSchemaFromCoreSchema } from "../zodSchema.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

type CoOptionalSchemaDefinition<
  Shape extends CoreCoValueSchema = CoreCoValueSchema,
> = {
  innerType: Shape;
};

export interface CoreCoOptionalSchema<
  Shape extends CoreCoValueSchema = CoreCoValueSchema,
> extends CoreCoValueSchema {
  builtin: "CoOptional";
  getDefinition: () => CoOptionalSchemaDefinition<Shape>;
  getZodSchema: () => z.ZodOptional<ReturnType<Shape["getZodSchema"]>>;
}

export interface CoOptionalSchema<
  Shape extends CoreCoValueSchema = CoreCoValueSchema,
> extends CoreCoOptionalSchema<Shape> {
  getCoValueClass: () => CoValueSchemaFromCoreSchema<Shape>["getCoValueClass"];
}

export function createCoOptionalSchema<T extends CoreCoValueSchema>(
  schema: T,
): CoOptionalSchema<T> {
  const zodSchema = z.optional(schema.getZodSchema());
  return Object.assign(zodSchema, {
    collaborative: true,
    builtin: "CoOptional" as const,
    getCoValueClass: () => {
      return (
        schema as unknown as CoValueSchemaFromCoreSchema<T>
      ).getCoValueClass();
    },
    getZodSchema: () => zodSchema,
  }) as unknown as CoOptionalSchema<T>;
}
