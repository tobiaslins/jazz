import {
  Account,
  AnyZodOrCoValueSchema,
  CoFeed,
  CoList,
  CoMap,
  CoPlainText,
  CoRichText,
  CoValueClass,
  CoreAccountSchema,
  CoreCoRecordSchema,
  FileStream,
} from "../../../internal.js";
import { CoreCoFeedSchema } from "../schemaTypes/CoFeedSchema.js";
import { CoreCoListSchema } from "../schemaTypes/CoListSchema.js";
import { CoreCoMapSchema } from "../schemaTypes/CoMapSchema.js";
import { CoreFileStreamSchema } from "../schemaTypes/FileStreamSchema.js";
import { CorePlainTextSchema } from "../schemaTypes/PlainTextSchema.js";
import { CoreRichTextSchema } from "../schemaTypes/RichTextSchema.js";
import { z } from "../zodReExport.js";
import { InstanceOrPrimitiveOfSchema } from "./InstanceOrPrimitiveOfSchema.js";

export type InstanceOfSchema<S extends CoValueClass | AnyZodOrCoValueSchema> =
  S extends z.core.$ZodType
    ? S extends CoreAccountSchema<infer Shape>
      ? {
          [key in keyof Shape]: InstanceOrPrimitiveOfSchema<Shape[key]>;
        } & Account
      : S extends CoreCoRecordSchema<infer K, infer V>
        ? {
            [key in z.output<K> & string]: InstanceOrPrimitiveOfSchema<V>;
          } & CoMap
        : S extends CoreCoMapSchema<infer Shape, infer Config>
          ? {
              [key in keyof Shape]: InstanceOrPrimitiveOfSchema<Shape[key]>;
            } & (unknown extends Config["out"][string]
              ? {}
              : {
                  [key: string]: Config["out"][string];
                }) &
              CoMap
          : S extends CoreCoListSchema<infer T>
            ? CoList<InstanceOrPrimitiveOfSchema<T>>
            : S extends CoreCoFeedSchema<infer T>
              ? CoFeed<InstanceOrPrimitiveOfSchema<T>>
              : S extends CorePlainTextSchema
                ? CoPlainText
                : S extends CoreRichTextSchema
                  ? CoRichText
                  : S extends CoreFileStreamSchema
                    ? FileStream
                    : S extends z.core.$ZodOptional<infer Inner>
                      ? InstanceOrPrimitiveOfSchema<Inner>
                      : S extends z.core.$ZodUnion<infer Members>
                        ? InstanceOrPrimitiveOfSchema<Members[number]>
                        : never
    : S extends CoValueClass
      ? InstanceType<S>
      : never;
