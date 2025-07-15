import { LocalNode, RawAccount } from "cojson";
import {
  Account,
  AccountClass,
  AnyCoRecordSchema,
  CoRecordSchema,
  CoValueClass,
  CoValueFromRaw,
  InstanceOfSchema,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Simplify,
} from "../../internal.js";
import {
  AccountSchema,
  AnyAccountSchema,
  BaseAccountShape,
} from "./schemaTypes/AccountSchema.js";
import {
  AnyCoDiscriminatedUnionSchema,
  AnyDiscriminableCoSchema,
  CoDiscriminatedUnionSchema,
} from "./schemaTypes/CoDiscriminatedUnionSchema.js";
import { AnyCoFeedSchema, CoFeedSchema } from "./schemaTypes/CoFeedSchema.js";
import { AnyCoListSchema, CoListSchema } from "./schemaTypes/CoListSchema.js";
import {
  AnyCoMapSchema,
  CoMapInitZod,
  CoMapSchema,
} from "./schemaTypes/CoMapSchema.js";
import {
  AnyCoOptionalSchema,
  CoOptionalSchema,
} from "./schemaTypes/CoOptionalSchema.js";
import { CoreCoValueSchema } from "./schemaTypes/CoValueSchema.js";
import {
  AnyFileStreamSchema,
  FileStreamSchema,
} from "./schemaTypes/FileStreamSchema.js";
import {
  AnyPlainTextSchema,
  PlainTextSchema,
} from "./schemaTypes/PlainTextSchema.js";
import {
  AnyRichTextSchema,
  RichTextSchema,
} from "./schemaTypes/RichTextSchema.js";
import { InstanceOfSchemaCoValuesNullable } from "./typeConverters/InstanceOfSchemaCoValuesNullable.js";
import { z } from "./zodReExport.js";

// defining an extra type for this, otherwise BaseSchema & {...} often
// gets expanded into a n inferred type that's too long for typescript to print
export type WithHelpers<
  Base extends AnyCoSchema,
  Helpers extends object,
> = Base & Helpers;

export type ZodPrimitiveSchema =
  | z.core.$ZodString
  | z.core.$ZodNumber
  | z.core.$ZodBoolean
  | z.core.$ZodNull
  | z.core.$ZodDate
  | z.core.$ZodLiteral;

export type CoValueClassOrSchema = CoValueClass | AnyCoSchema;

// TODO rename to CoValueSchemaFromCoProtoSchema
export type CoValueSchemaFromZodSchema<S extends AnyZodOrCoValueSchema> =
  S extends z.core.$ZodType
    ? S extends AnyAccountSchema<infer Shape extends BaseAccountShape>
      ? AccountSchema<Shape>
      : S extends AnyCoRecordSchema<infer K, infer V>
        ? CoRecordSchema<K, V>
        : S extends AnyCoMapSchema<infer Shape, infer Config>
          ? CoMapSchema<Shape, Config>
          : S extends AnyCoListSchema<infer T>
            ? CoListSchema<T>
            : S extends AnyCoFeedSchema<infer T>
              ? CoFeedSchema<T>
              : S extends AnyPlainTextSchema
                ? PlainTextSchema
                : S extends AnyRichTextSchema
                  ? RichTextSchema
                  : S extends AnyFileStreamSchema
                    ? FileStreamSchema
                    : S extends
                          | z.core.$ZodOptional<
                              infer Inner extends z.core.$ZodType &
                                CoreCoValueSchema
                            >
                          | z.ZodOptional<infer Inner>
                      ? CoOptionalSchema<Inner>
                      : S extends z.core.$ZodUnion<
                            infer Members extends readonly [
                              AnyDiscriminableCoSchema,
                              ...AnyDiscriminableCoSchema[],
                            ]
                          >
                        ? CoDiscriminatedUnionSchema<Members>
                        : never
    : never;

export type CoValueClassFromAnySchema<S extends CoValueClassOrSchema> =
  S extends CoValueClass<any>
    ? S
    : CoValueClass<InstanceOfSchema<S>> &
        CoValueFromRaw<InstanceOfSchema<S>> &
        (S extends AnyAccountSchema ? AccountClassEssentials : {});

type AccountClassEssentials = {
  fromRaw: <A extends Account>(this: AccountClass<A>, raw: RawAccount) => A;
  fromNode: <A extends Account>(this: AccountClass<A>, node: LocalNode) => A;
};

// TODO rename to CoreCoSchema
export type AnyCoSchema =
  | AnyCoMapSchema
  | AnyAccountSchema
  | AnyCoRecordSchema
  | AnyCoListSchema
  | AnyCoFeedSchema
  | AnyCoDiscriminatedUnionSchema<any>
  | AnyCoOptionalSchema
  | AnyPlainTextSchema
  | AnyRichTextSchema
  | AnyFileStreamSchema;

export type AnyZodSchema = z.core.$ZodType;

export type AnyZodOrCoValueSchema = AnyZodSchema | AnyCoSchema;

export type Loaded<
  T extends CoValueClass | AnyCoSchema,
  R extends ResolveQuery<T> = true,
> = Resolved<NonNullable<InstanceOfSchemaCoValuesNullable<T>>, R>;

export type ResolveQuery<T extends CoValueClass | AnyCoSchema> = RefsToResolve<
  NonNullable<InstanceOfSchemaCoValuesNullable<T>>
>;

export type ResolveQueryStrict<
  T extends CoValueClass | AnyCoSchema,
  R extends ResolveQuery<T>,
> = RefsToResolveStrict<NonNullable<InstanceOfSchemaCoValuesNullable<T>>, R>;

export type InitFor<T extends CoValueClass | AnyCoSchema> =
  T extends AnyCoMapSchema<infer Shape> ? Simplify<CoMapInitZod<Shape>> : never;
