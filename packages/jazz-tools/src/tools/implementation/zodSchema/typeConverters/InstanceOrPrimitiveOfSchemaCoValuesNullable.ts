import {
  Account,
  AnyZodOrCoValueSchema,
  CoDiscriminatedUnionSchema,
  CoFeed,
  CoList,
  CoMap,
  CoPlainText,
  CoRichText,
  CoValueClass,
  CoreAccountSchema,
  CoreCoRecordSchema,
  FileStream,
  Profile,
} from "../../../internal.js";
import { CoreCoFeedSchema } from "../schemaTypes/CoFeedSchema.js";
import { CoreCoListSchema } from "../schemaTypes/CoListSchema.js";
import { CoreCoMapSchema } from "../schemaTypes/CoMapSchema.js";
import { CoreCoOptionalSchema } from "../schemaTypes/CoOptionalSchema.js";
import { CoreCoValueSchema } from "../schemaTypes/CoValueSchema.js";
import { CoreFileStreamSchema } from "../schemaTypes/FileStreamSchema.js";
import { CorePlainTextSchema } from "../schemaTypes/PlainTextSchema.js";
import { CoreRichTextSchema } from "../schemaTypes/RichTextSchema.js";
import { z } from "../zodReExport.js";
import { TypeOfZodSchema } from "./TypeOfZodSchema.js";

export type InstanceOrPrimitiveOfSchemaCoValuesNullable<
  S extends CoValueClass | AnyZodOrCoValueSchema,
> = S extends CoreCoValueSchema
  ? S extends CoreAccountSchema<infer Shape>
    ?
        | ({
            -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchemaCoValuesNullable<
              Shape[key]
            >;
          } & { profile: Profile | null } & Account)
        | null
    : S extends CoreCoRecordSchema<infer K, infer V>
      ?
          | ({
              -readonly [key in z.output<K> &
                string]: InstanceOrPrimitiveOfSchemaCoValuesNullable<V>;
            } & CoMap)
          | null
      : S extends CoreCoMapSchema<infer Shape, infer CatchAll>
        ?
            | ({
                -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchemaCoValuesNullable<
                  Shape[key]
                >;
              } & (CatchAll extends AnyZodOrCoValueSchema
                ? {
                    [
                      key: string
                    ]: InstanceOrPrimitiveOfSchemaCoValuesNullable<CatchAll>;
                  }
                : {}) &
                CoMap)
            | null
        : S extends CoreCoListSchema<infer T>
          ? CoList<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>> | null
          : S extends CoreCoFeedSchema<infer T>
            ? CoFeed<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>> | null
            : S extends CorePlainTextSchema
              ? CoPlainText | null
              : S extends CoreRichTextSchema
                ? CoRichText | null
                : S extends CoreFileStreamSchema
                  ? FileStream | null
                  : S extends CoreCoOptionalSchema<infer T>
                    ? InstanceOrPrimitiveOfSchemaCoValuesNullable<T> | undefined
                    : S extends CoDiscriminatedUnionSchema<infer Members>
                      ? InstanceOrPrimitiveOfSchemaCoValuesNullable<
                          Members[number]
                        >
                      : never
  : S extends z.core.$ZodType
    ? TypeOfZodSchema<S>
    : S extends CoValueClass
      ? InstanceType<S> | null
      : never;
