import z from "zod";
import {
  Account,
  CoFeed,
  CoList,
  CoMap,
  CoPlainText,
  CoValueClass,
  FileStream,
  Profile,
} from "../../../internal.js";
import { AnyCoFeedSchema } from "../schemaTypes/CoFeedSchema.js";
import { AnyCoListSchema } from "../schemaTypes/CoListSchema.js";
import { AnyCoMapSchema } from "../schemaTypes/CoMapSchema.js";
import { FileStreamSchema } from "../schemaTypes/FileStreamSchema.js";
import { PlainTextSchema } from "../schemaTypes/PlainTextSchema.js";

export type InstanceOrPrimitiveOfSchema<
  S extends CoValueClass | z.core.$ZodType,
> = S extends z.core.$ZodType
  ? S extends z.core.$ZodObject<infer Shape> & {
      collaborative: true;
      builtin: "Account";
    }
    ? {
        -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchema<Shape[key]>;
      } & { profile: Profile } & Account
    : S extends z.core.$ZodRecord<infer K, infer V> & {
          collaborative: true;
        }
      ? {
          -readonly [key in z.output<K> &
            string]: InstanceOrPrimitiveOfSchema<V>;
        } & CoMap
      : S extends AnyCoMapSchema<infer Shape, infer OutExtra>
        ? {
            -readonly [key in keyof Shape]: InstanceOrPrimitiveOfSchema<
              Shape[key]
            >;
          } & (unknown extends OutExtra[string]
            ? {}
            : {
                [key: string]: OutExtra[string];
              }) &
            CoMap
        : S extends AnyCoListSchema<infer T>
          ? CoList<InstanceOrPrimitiveOfSchema<T>>
          : S extends AnyCoFeedSchema<infer T>
            ? CoFeed<InstanceOrPrimitiveOfSchema<T>>
            : S extends PlainTextSchema
              ? CoPlainText
              : S extends FileStreamSchema
                ? FileStream
                : S extends z.core.$ZodOptional<infer Inner>
                  ? InstanceOrPrimitiveOfSchema<Inner> | undefined
                  : S extends z.core.$ZodTuple<infer Items>
                    ? {
                        [key in keyof Items]: InstanceOrPrimitiveOfSchema<
                          Items[key]
                        >;
                      }
                    : S extends z.core.$ZodUnion<infer Members>
                      ? InstanceOrPrimitiveOfSchema<Members[number]>
                      : S extends z.core.$ZodString
                        ? string
                        : S extends z.core.$ZodNumber
                          ? number
                          : S extends z.core.$ZodBoolean
                            ? boolean
                            : S extends z.core.$ZodLiteral<infer Literal>
                              ? Literal
                              : S extends z.core.$ZodDate
                                ? Date
                                : never
  : S extends CoValueClass
    ? InstanceType<S>
    : never;
