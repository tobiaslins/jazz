import { CoValueClass } from "../../../internal.js";
import { z } from "../zodReExport.js";
import { CoValueClassFromZodSchema, ZodPrimitiveSchema } from "../zodSchema.js";
export declare function tryZodSchemaToCoSchema<S extends z.core.$ZodType>(
  schema: S,
): CoValueClassFromZodSchema<S> | null;
export declare function zodSchemaToCoSchema<
  S extends
    | z.core.$ZodType
    | (z.core.$ZodObject<any, any> & {
        builtin: "Account";
        migration?: (
          account: any,
          creationProps?: {
            name: string;
          },
        ) => void;
      })
    | (z.core.$ZodCustom<any, any> & {
        builtin: "FileStream";
      })
    | (z.core.$ZodCustom<any, any> & {
        builtin: "CoFeed";
        element: z.core.$ZodType;
      }),
>(schema: S): CoValueClassFromZodSchema<S>;
export declare function anySchemaToCoSchema<
  S extends
    | CoValueClass
    | z.core.$ZodType
    | (z.core.$ZodObject<any, any> & {
        builtin: "Account";
        migration?: (
          account: any,
          creationProps?: {
            name: string;
          },
        ) => void;
      })
    | (z.core.$ZodCustom<any, any> & {
        builtin: "FileStream";
      })
    | (z.core.$ZodCustom<any, any> & {
        builtin: "CoFeed";
        element: z.core.$ZodType;
      }),
>(
  schema: S,
): S extends CoValueClass
  ? S
  : S extends z.core.$ZodType
    ? CoValueClassFromZodSchema<S>
    : never;
export declare function zodSchemaToCoSchemaOrKeepPrimitive<
  S extends z.core.$ZodType,
>(schema: S): CoValueClassFromZodSchema<S> | ZodPrimitiveSchema;
