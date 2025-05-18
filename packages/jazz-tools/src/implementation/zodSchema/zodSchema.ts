import { LocalNode, RawAccount } from "cojson";
import z from "zod";
import {
  Account,
  AccountClass,
  CoValue,
  CoValueClass,
  CoValueFromRaw,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
} from "../../internal.js";
import { AnyAccountSchema } from "./schemaTypes/AccountSchema.js";
import { AnyCoFeedSchema } from "./schemaTypes/CoFeedSchema.js";
import { AnyCoListSchema } from "./schemaTypes/CoListSchema.js";
import { AnyCoMapSchema } from "./schemaTypes/CoMapSchema.js";
import { AnyCoRecordSchema } from "./schemaTypes/CoRecordSchema.js";
import { FileStreamSchema } from "./schemaTypes/FileStreamSchema.js";
import { PlainTextSchema } from "./schemaTypes/PlainTextSchema.js";
import { InstanceOfSchema } from "./typeConverters/InstanceOfSchema.js";
import { InstanceOfSchemaCoValuesNullable } from "./typeConverters/InstanceOfSchemaCoValuesNullable.js";
import { InstanceOrPrimitiveOfSchema } from "./typeConverters/InstanceOrPrimitiveOfSchema.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "./typeConverters/InstanceOrPrimitiveOfSchemaCoValuesNullable.js";

// defining an extra type for this, otherwise BaseSchema & {...} often
// gets expanded into a n inferred type that's too long for typescript to print
export type WithHelpers<
  Base extends z.core.$ZodType,
  Helpers extends object,
> = Base & Helpers;

export type FullyOrPartiallyLoaded<S extends z.core.$ZodType | CoValueClass> =
  InstanceOrPrimitiveOfSchema<S> extends CoValue
    ? NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<S>>
    : InstanceOrPrimitiveOfSchema<S>;

export type ZodPrimitiveSchema =
  | z.core.$ZodString
  | z.core.$ZodNumber
  | z.core.$ZodBoolean
  | z.core.$ZodNull
  | z.core.$ZodDate
  | z.core.$ZodLiteral;

export type AnyCoUnionSchema = z.core.$ZodDiscriminatedUnion<
  (
    | (z.core.$ZodType & { collaborative: true })
    | z.core.$ZodDiscriminatedUnion
  )[]
>;

export type CoValueOrZodSchema =
  | CoValueClass
  | AnyCoMapSchema
  | AnyCoFeedSchema
  | AnyCoRecordSchema
  | AnyCoListSchema
  | AnyCoUnionSchema;

export type CoValueClassFromZodSchema<S extends z.core.$ZodType> = CoValueClass<
  InstanceOfSchema<S>
> &
  CoValueFromRaw<InstanceOfSchema<S>> &
  (S extends AnyAccountSchema ? AccountClassEssentials : {});

type AccountClassEssentials = {
  fromRaw: <A extends Account>(this: AccountClass<A>, raw: RawAccount) => A;
  fromNode: <A extends Account>(this: AccountClass<A>, node: LocalNode) => A;
};

type AnyCoSchema =
  | AnyCoMapSchema
  | AnyAccountSchema
  | AnyCoRecordSchema
  | AnyCoListSchema
  | AnyCoFeedSchema
  | AnyCoUnionSchema
  | PlainTextSchema
  | FileStreamSchema;

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
