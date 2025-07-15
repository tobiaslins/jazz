import { z } from "../zodReExport.js";
import { AnyCoSchema, CoValueSchemaFromZodSchema } from "../zodSchema.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

export type AnyCoOptionalSchema<
  Shape extends z.core.$ZodType & CoreCoValueSchema = z.core.$ZodType &
    CoreCoValueSchema,
> = CoreCoValueSchema &
  z.ZodOptional<Shape> & {
    collaborative: true;
    builtin: "CoOptional";
    getZodSchema: () => z.ZodOptional<Shape>;
  };

export type CoOptionalSchema<
  Shape extends z.core.$ZodType & CoreCoValueSchema = z.core.$ZodType &
    CoreCoValueSchema,
> = AnyCoOptionalSchema<Shape> & {
  getCoValueClass: () => CoValueSchemaFromZodSchema<Shape>["getCoValueClass"];
};

export function createCoOptionalSchema<T extends AnyCoSchema>(
  schema: T,
): CoOptionalSchema<T> {
  const zodSchema = z.optional(schema);
  return Object.assign(zodSchema, {
    collaborative: true,
    builtin: "CoOptional" as const,
    getCoValueClass: () => {
      return (
        schema as CoValueSchemaFromZodSchema<AnyCoSchema>
      ).getCoValueClass();
    },
    getZodSchema: () => zodSchema,
  }) as unknown as CoOptionalSchema<T>;
}
