import { JsonValue } from "cojson";
import {
  Account,
  CoDiscriminatedUnionSchema,
  CoFeed,
  CoList,
  CoPlainText,
  CoRichText,
  CoValueClass,
  CoreAccountSchema,
  CoreCoFeedSchema,
  CoreCoListSchema,
  CoreCoMapSchema,
  CoreCoRecordSchema,
  CoreFileStreamSchema,
  CorePlainTextSchema,
  FileStream,
  InstanceOrPrimitiveOfSchema,
  NotNull,
  Profile,
} from "../../../internal.js";
import { CoreCoOptionalSchema } from "../schemaTypes/CoOptionalSchema.js";
import { CoreCoValueSchema } from "../schemaTypes/CoValueSchema.js";
import { CoreRichTextSchema } from "../schemaTypes/RichTextSchema.js";
import { z } from "../zodReExport.js";
import { AnyZodOrCoValueSchema } from "../zodSchema.js";
import { TypeOfZodSchema } from "./TypeOfZodSchema.js";

/**
 * Returns the type of the value that should be used to initialize a coField
 * of the given schema.
 */
export type CoFieldInit<T extends AnyZodOrCoValueSchema> =
  T extends z.core.$ZodNullable
    ? InstanceOrPrimitiveOfSchemaInit<T>
    : NotNull<InstanceOrPrimitiveOfSchemaInit<T>>;

// Makes all of the value's fields nullable by default, to support using
// partially-loaded CoValues to initialize new CoValues.
// TODO this isn't correct: the input should either be a partially-loaded CoValue
// or a "complete" JSON object that can be used to create a new CoValue.
type InstanceOrPrimitiveOfSchemaInit<
  S extends CoValueClass | AnyZodOrCoValueSchema,
> = S extends CoreCoValueSchema
  ? S extends CoreAccountSchema<infer Shape>
    ?
        | ({
            -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchemaInit<
              Shape[key]
            >;
          } & { profile: Profile | null } & Account)
        | null
    : S extends CoreCoRecordSchema<infer K, infer V>
      ?
          | {
              -readonly [key in z.output<K> &
                string]: InstanceOrPrimitiveOfSchemaInit<V>;
            }
          | null
      : S extends CoreCoMapSchema<infer Shape, infer CatchAll>
        ?
            | ({
                -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchemaInit<
                  Shape[key]
                >;
              } & (CatchAll extends AnyZodOrCoValueSchema
                ? {
                    [key: string]: InstanceOrPrimitiveOfSchemaInit<CatchAll>;
                  }
                : {}))
            | null
        : S extends CoreCoListSchema<infer T>
          ? ReadonlyArray<InstanceOrPrimitiveOfSchemaInit<T>> | null
          : S extends CoreCoFeedSchema<infer T>
            ?
                | ReadonlyArray<InstanceOrPrimitiveOfSchemaInit<T>>
                | CoFeed<InstanceOrPrimitiveOfSchemaInit<T>>
                | null
            : S extends CorePlainTextSchema
              ? string | CoPlainText | null
              : S extends CoreRichTextSchema
                ? string | CoRichText | null
                : S extends CoreFileStreamSchema
                  ? FileStream | null
                  : S extends CoreCoOptionalSchema<infer T>
                    ? InstanceOrPrimitiveOfSchemaInit<T> | undefined
                    : S extends CoDiscriminatedUnionSchema<infer Members>
                      ? InstanceOrPrimitiveOfSchemaInit<Members[number]>
                      : never
  : S extends z.core.$ZodType
    ? TypeOfZodSchema<S>
    : S extends CoValueClass
      ? InstanceType<S> | null
      : never;
