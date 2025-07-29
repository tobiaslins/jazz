import { JsonValue } from "cojson";
import { z } from "../zodReExport.js";

/**
 * Get type from Zod schema definition.
 *
 * Similar to `z.infer`, but we manually traverse Zod types to ensure we only allow what we can handle
 */
export type TypeOfZodSchema<S extends z.core.$ZodType> =
  S extends z.core.$ZodOptional<infer Inner extends z.core.$ZodType>
    ? TypeOfZodSchema<Inner> | undefined
    : S extends z.core.$ZodNullable<infer Inner extends z.core.$ZodType>
      ? TypeOfZodSchema<Inner> | null
      : S extends z.ZodJSONSchema
        ? JsonValue
        : S extends z.core.$ZodUnion<
              infer Members extends readonly z.core.$ZodType[]
            >
          ? TypeOfZodSchema<Members[number]>
          : S extends z.core.$ZodObject<infer Shape>
            ? {
                -readonly [key in keyof Shape]: TypeOfZodSchema<Shape[key]>;
              }
            : S extends z.core.$ZodArray<infer Item extends z.core.$ZodType>
              ? TypeOfZodSchema<Item>[]
              : S extends z.core.$ZodTuple<
                    infer Items extends readonly z.core.$ZodType[]
                  >
                ? {
                    [key in keyof Items]: TypeOfZodSchema<Items[key]>;
                  }
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
                          : S extends z.core.$ZodEnum<infer Enum>
                            ? Enum[keyof Enum]
                            : S extends z.core.$ZodTemplateLiteral<
                                  infer pattern
                                >
                              ? pattern
                              : S extends z.core.$ZodReadonly<
                                    infer Inner extends z.core.$ZodType
                                  >
                                ? TypeOfZodSchema<Inner>
                                : S extends z.core.$ZodDefault<
                                      infer Default extends z.core.$ZodType
                                    >
                                  ? TypeOfZodSchema<Default>
                                  : S extends z.core.$ZodCatch<
                                        infer Catch extends z.core.$ZodType
                                      >
                                    ? TypeOfZodSchema<Catch>
                                    : never;
