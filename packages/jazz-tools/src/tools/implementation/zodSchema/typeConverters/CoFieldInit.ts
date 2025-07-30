import { NotNull } from "../../../internal.js";
import { z } from "../zodReExport.js";
import { AnyZodOrCoValueSchema } from "../zodSchema.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "./InstanceOrPrimitiveOfSchemaCoValuesNullable.js";

/**
 * Returns the type of the value that should be used to initialize a coField
 * of the given schema.
 */
export type CoFieldInit<T extends AnyZodOrCoValueSchema> =
  T extends z.core.$ZodNullable
    ? InstanceOrPrimitiveOfSchemaCoValuesNullable<T>
    : NotNull<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>>;
