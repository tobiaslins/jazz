import {
  Account,
  AnyAccountSchema,
  AnyCoFeedSchema,
  AnyCoListSchema,
  AnyCoMapSchema,
  AnyCoRecordSchema,
  AnyZodOrCoValueSchema,
  CoFeed,
  CoList,
  CoMap,
  CoPlainText,
  CoRichText,
  CoValueClass,
  FileStream,
} from "../../../internal.js";
import { AnyFileStreamSchema } from "../schemaTypes/FileStreamSchema.js";
import { AnyPlainTextSchema } from "../schemaTypes/PlainTextSchema.js";
import { AnyRichTextSchema } from "../schemaTypes/RichTextSchema.js";
import { z } from "../zodReExport.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "./InstanceOrPrimitiveOfSchemaCoValuesNullable.js";

export type InstanceOfSchemaCoValuesNullable<
  S extends CoValueClass | AnyZodOrCoValueSchema,
> = S extends z.core.$ZodType
  ? S extends AnyAccountSchema<infer Shape>
    ?
        | ({
            [key in keyof Shape]: InstanceOrPrimitiveOfSchemaCoValuesNullable<
              Shape[key]
            >;
          } & Account)
        | null
    : S extends AnyCoRecordSchema<infer K, infer V>
      ?
          | ({
              [key in z.output<K> &
                string]: InstanceOrPrimitiveOfSchemaCoValuesNullable<V>;
            } & CoMap)
          | null
      : S extends AnyCoMapSchema<infer Shape, infer Config>
        ?
            | ({
                [key in keyof Shape]: InstanceOrPrimitiveOfSchemaCoValuesNullable<
                  Shape[key]
                >;
              } & (unknown extends Config["out"][string]
                ? {}
                : {
                    [key: string]: Config["out"][string];
                  }) &
                CoMap)
            | null
        : S extends AnyCoListSchema<infer T>
          ? CoList<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>> | null
          : S extends AnyCoFeedSchema<infer T>
            ? CoFeed<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>> | null
            : S extends AnyPlainTextSchema
              ? CoPlainText | null
              : S extends AnyRichTextSchema
                ? CoRichText | null
                : S extends AnyFileStreamSchema
                  ? FileStream | null
                  : S extends z.core.$ZodOptional<infer Inner>
                    ?
                        | InstanceOrPrimitiveOfSchemaCoValuesNullable<Inner>
                        | undefined
                    : S extends z.core.$ZodUnion<infer Members>
                      ? InstanceOrPrimitiveOfSchemaCoValuesNullable<
                          Members[number]
                        >
                      : never
  : S extends CoValueClass
    ? InstanceType<S> | null
    : never;
