import { RawAccount, RawCoList, RawCoMap } from "cojson";
import {
  AnyCoDiscriminatedUnionSchema,
  AnyDiscriminableCoSchema,
  AnyZodOrCoValueSchema,
  CoMap,
} from "../../internal.js";
import {
  coreSchemaToCoSchema,
  isAnyCoValueSchema,
} from "./runtimeConverters/zodSchemaToCoSchema.js";
import { AnyCoMapSchema } from "./schemaTypes/CoMapSchema.js";
import { z } from "./zodReExport.js";

export function schemaUnionDiscriminatorFor(
  schema: z.core.$ZodDiscriminatedUnion,
) {
  if (isUnionOfCoMapsDeeply(schema)) {
    const discriminatorMap = schema._zod.disc;
    if (!discriminatorMap || discriminatorMap.size == 0) {
      throw new Error(
        "z.union() of collaborative types is not supported, use co.discriminatedUnion() instead",
      );
    }

    const discriminator = schema._zod.def.discriminator;
    const field = discriminatorMap.get(discriminator);

    if (!field) {
      throw new Error(
        "co.discriminatedUnion() of collaborative types with non-existent discriminator key is not supported",
      );
    }

    for (const value of field.values) {
      if (typeof value !== "string" && typeof value !== "number") {
        throw new Error(
          "co.discriminatedUnion() of collaborative types with non-string or non-number discriminator value is not supported",
        );
      }
    }

    const availableOptions: AnyDiscriminableCoSchema[] = [];

    for (const option of schema._zod.def.options) {
      if (option._zod.def.type === "object") {
        availableOptions.push(option as AnyCoMapSchema);
      } else if (option._zod.def.type === "union") {
        for (const subOption of (option as AnyCoDiscriminatedUnionSchema<any>)
          ._zod.def.options) {
          if (subOption._zod.def.type === "object") {
            availableOptions.push(subOption as AnyCoMapSchema);
          }
        }
      } else {
        throw new Error(
          "Unsupported zod type in co.discriminatedUnion() of collaborative types",
        );
      }
    }

    const determineSchema = (_raw: RawCoMap | RawAccount | RawCoList) => {
      if (_raw instanceof RawCoList) {
        throw new Error(
          "co.discriminatedUnion() of collaborative types is not supported for CoLists",
        );
      }

      for (const option of availableOptions) {
        let match = true;

        for (const key of discriminatorMap.keys()) {
          const discriminatorDef = (option as z.core.$ZodObject)._zod.def.shape[
            key as string
          ];

          const discriminatorValue = (_raw as RawCoMap).get(key as string);

          if (discriminatorValue && typeof discriminatorValue === "object") {
            throw new Error("Discriminator must be a primitive value");
          }

          if (!discriminatorDef) {
            if (key === discriminator) {
              match = false;
              break;
            } else {
              continue;
            }
          }

          if (discriminatorDef._zod.def.type !== "literal") {
            break;
          }

          const literalDef = discriminatorDef._zod.def as z.core.$ZodLiteralDef;

          if (!Array.from(literalDef.values).includes(discriminatorValue)) {
            match = false;
            break;
          }
        }

        if (match) {
          const coValueSchema = coreSchemaToCoSchema(option);
          return coValueSchema.getCoValueClass() as typeof CoMap;
        }
      }

      throw new Error(
        "co.discriminatedUnion() of collaborative types with no matching discriminator value found",
      );
    };

    return determineSchema;
  } else {
    throw new Error(
      "z.discriminatedUnion() of non-collaborative types is not supported",
    );
  }
}

export function isUnionOfCoMapsDeeply(
  schema: AnyZodOrCoValueSchema,
): schema is z.core.$ZodDiscriminatedUnion {
  if (schema instanceof z.core.$ZodUnion) {
    return schema._zod.def.options.every(isCoMapOrUnionOfCoMapsDeeply);
  } else {
    return false;
  }
}

function isCoMapOrUnionOfCoMapsDeeply(
  schema: AnyZodOrCoValueSchema,
): schema is z.core.$ZodDiscriminatedUnion {
  if (schema instanceof z.core.$ZodObject && isAnyCoValueSchema(schema)) {
    return true;
  } else if (schema instanceof z.core.$ZodUnion) {
    return schema._zod.def.options.every(isCoMapOrUnionOfCoMapsDeeply);
  } else {
    return false;
  }
}

export function isUnionOfPrimitivesDeeply(schema: AnyZodOrCoValueSchema) {
  if (schema instanceof z.core.$ZodUnion) {
    return schema._zod.def.options.every(isUnionOfPrimitivesDeeply);
  } else {
    return !isAnyCoValueSchema(schema);
  }
}
