import { CoMap, CoValueClass } from "../../../internal.js";
import { z } from "../zodReExport.js";
import { ZodPrimitiveSchema } from "../zodSchema.js";
type FieldSchema =
  | CoValueClass
  | ZodPrimitiveSchema
  | z.core.$ZodOptional<z.core.$ZodType>
  | z.core.$ZodUnion<z.core.$ZodType[]>
  | z.core.$ZodObject<z.core.$ZodLooseShape>
  | z.core.$ZodArray<z.core.$ZodType>
  | z.core.$ZodTuple<z.core.$ZodType[]>
  | z.core.$ZodReadonly<z.core.$ZodType>
  | z.core.$ZodLazy<z.core.$ZodType>
  | z.core.$ZodTemplateLiteral<any>
  | z.core.$ZodLiteral<any>
  | z.core.$ZodCatch<z.core.$ZodType>
  | z.core.$ZodEnum<any>
  | z.core.$ZodDefault<z.core.$ZodType>
  | z.core.$ZodCatch<z.core.$ZodType>
  | (z.core.$ZodCustom<any, any> & {
      builtin: any;
    });
export declare function zodFieldToCoFieldDef(
  schema: FieldSchema,
):
  | string
  | number
  | boolean
  | import("../../../internal.js").CoValue
  | CoMap
  | Date
  | null
  | undefined;
export {};
