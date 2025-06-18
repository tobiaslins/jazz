import {
  AccountSchema,
  AnyCoMapSchema,
  CoFeedSchema,
  CoListSchema,
  CoMapSchema,
  CoProfileSchema,
  CoRecordSchema,
  FileStreamSchema,
  ImageDefinition,
  PlainTextSchema,
} from "../../internal.js";
import { RichTextSchema } from "./schemaTypes/RichTextSchema.js";
import { z } from "./zodReExport.js";
export declare const coMapDefiner: <Shape extends z.core.$ZodLooseShape>(
  shape: Shape,
) => CoMapSchema<Shape>;
export declare const coAccountDefiner: <
  Shape extends {
    profile: AnyCoMapSchema<{
      name: z.core.$ZodString<string>;
      inbox?: z.core.$ZodOptional<z.core.$ZodString>;
      inboxInvite?: z.core.$ZodOptional<z.core.$ZodString>;
    }>;
    root: AnyCoMapSchema;
  },
>(
  shape?: Shape,
) => AccountSchema<Shape>;
export declare const coRecordDefiner: <
  K extends z.core.$ZodString<string>,
  V extends z.core.$ZodType,
>(
  _keyType: K,
  valueType: V,
) => CoRecordSchema<K, V>;
export declare const coListDefiner: <T extends z.core.$ZodType>(
  element: T,
) => CoListSchema<T>;
export declare const coProfileDefiner: <
  Shape extends z.core.$ZodLooseShape = {
    name: z.core.$ZodString<string>;
    inbox: z.core.$ZodOptional<z.core.$ZodString>;
    inboxInvite: z.core.$ZodOptional<z.core.$ZodString>;
  },
>(
  shape?: Shape & {
    name?: z.core.$ZodString<string>;
    inbox?: z.core.$ZodOptional<z.core.$ZodString>;
    inboxInvite?: z.core.$ZodOptional<z.core.$ZodString>;
  },
) => CoProfileSchema<Shape>;
export declare const coFeedDefiner: <T extends z.core.$ZodType>(
  element: T,
) => CoFeedSchema<T>;
export declare const coFileStreamDefiner: () => FileStreamSchema;
export declare const coPlainTextDefiner: () => PlainTextSchema;
export declare const coRichTextDefiner: () => RichTextSchema;
export declare const coImageDefiner: () => typeof ImageDefinition;
