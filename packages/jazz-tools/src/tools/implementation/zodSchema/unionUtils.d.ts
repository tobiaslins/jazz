import { RawAccount, RawCoList, RawCoMap } from "cojson";
import { z } from "./zodReExport.js";
export declare function schemaUnionDiscriminatorFor(
  schema: z.core.$ZodDiscriminatedUnion,
): (_raw: RawCoMap | RawAccount | RawCoList) => import(
  "./zodSchema.js",
).CoValueClassFromZodSchema<
  z.core.$ZodObject<
    Readonly<
      Readonly<{
        [k: string]: z.core.$ZodType<unknown, unknown>;
      }>
    >,
    z.core.$ZodObjectConfig
  >
>;
export declare function isUnionOfCoMapsDeeply(
  schema: z.core.$ZodType,
): schema is z.core.$ZodDiscriminatedUnion;
export declare function isUnionOfPrimitivesDeeply(
  schema: z.core.$ZodType,
): boolean;
