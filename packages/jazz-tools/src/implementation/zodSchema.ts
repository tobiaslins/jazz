import { CoValueUniqueness, RawCoList, RawCoMap, RawCoValue } from "cojson";
import z from "zod";
import {
  Account,
  AnonymousJazzAgent,
  CoList,
  CoMap,
  CoMapInit,
  CoValueClass,
  FileStream,
  Group,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Simplify,
  SubscribeListenerOptions,
  SubscribeRestArgs,
  coField,
  isCoValueClass,
} from "../internal.js";

// conversion from zod to old jazz-tools schemas

export type CoMapSchema<
  Shape extends z.core.$ZodLooseShape,
  OutExtra extends Record<string, unknown> = Record<string, unknown>,
> = z.core.$ZodObject<Shape, OutExtra> &
  z.$ZodTypeDiscriminable & {
    create: (
      init: Simplify<
        {
          [key in keyof Shape as Shape[key] extends z.ZodOptional<any>
            ? key
            : never]?: coField<InstanceOrPrimitive<Shape[key]>>;
        } & {
          [key in keyof Shape as Shape[key] extends z.ZodOptional<any>
            ? never
            : key]: coField<InstanceOrPrimitive<Shape[key]>>;
        }
      >,
      options?:
        | {
            owner: Account | Group;
            unique?: CoValueUniqueness["uniqueness"];
          }
        | Account
        | Group,
    ) => {
      -readonly [key in keyof Shape]: coField<InstanceOrPrimitive<Shape[key]>>;
    } & (unknown extends OutExtra[string]
      ? {}
      : {
          [key: string]: coField<OutExtra[string]>;
        }) &
      CoMap;
    collaborative: true;
    catchall<T extends z.core.$ZodType>(
      schema: T,
    ): CoMapSchema<Shape, Record<string, T["_zod"]["output"]>>;
    withHelpers<T extends object>(helpers: T): CoMapSchema<Shape, OutExtra> & T;
  };
export type CoListSchema<T extends z.core.$ZodType> = z.core.$ZodArray<T> & {
  collaborative: true;
  create: (
    items: InstanceOrPrimitive<T>[],
    options?: { owner: Account | Group } | Account | Group,
  ) => CoList<coField<InstanceOrPrimitive<T>>>;
};
export type FileStreamSchema = z.core.$ZodCustom<FileStream, unknown> & {
  collaborative: true;
  create: (typeof FileStream)["create"];
};

let coSchemasForZodSchemas = new Map<z.core.$ZodType, CoValueClass>();

export function zodSchemaToCoSchema<
  S extends
    | z.core.$ZodType
    | (z.core.$ZodCustom<any, any> & { builtin: CoValueClass }),
>(schema: S): CoValueClassOrPrimitiveFromZodSchema<S> {
  if ("collaborative" in schema && schema.collaborative) {
    if (coSchemasForZodSchemas.has(schema)) {
      return coSchemasForZodSchemas.get(
        schema,
      ) as CoValueClassOrPrimitiveFromZodSchema<S>;
    }

    if (schema instanceof z.core.$ZodObject) {
      const def = (schema as z.core.$ZodObject)._zod.def;
      const coSchema = class ZCoMap extends CoMap {
        constructor(options: { fromRaw: RawCoMap } | undefined) {
          super(options);
          for (const [field, fieldType] of Object.entries(def.shape)) {
            (this as any)[field] = fieldDef(zodSchemaToCoSchema(fieldType));
          }
          if (def.catchall) {
            (this as any)[coField.items] = fieldDef(
              zodSchemaToCoSchema(def.catchall),
            );
          }
        }
      };

      coSchemasForZodSchemas.set(schema, coSchema);
      return coSchema as unknown as CoValueClassOrPrimitiveFromZodSchema<S>;
    } else if (schema instanceof z.core.$ZodArray) {
      const def = (schema as z.core.$ZodArray)._zod.def;
      const coSchema = class ZCoList extends CoList {
        constructor(options: { fromRaw: RawCoList } | undefined) {
          super(options);
          (this as any)[coField.items] = fieldDef(
            zodSchemaToCoSchema(def.element),
          );
        }
      };

      coSchemasForZodSchemas.set(schema, coSchema);
      return coSchema as unknown as CoValueClassOrPrimitiveFromZodSchema<S>;
    } else if (schema._zod.def.type === "custom") {
      if ("builtin" in schema) {
        return schema.builtin as CoValueClassOrPrimitiveFromZodSchema<S>;
      } else {
        throw new Error(`Unsupported custom zod type`);
      }
    } else {
      throw new Error(
        `Unsupported zod CoValue type for top-level schema: ${schema._zod.def.type}`,
      );
    }
  } else {
    return schema as CoValueClassOrPrimitiveFromZodSchema<S>;
  }
}

export function fieldDef(
  schema:
    | CoValueClass
    | z.core.$ZodString
    | z.core.$ZodNumber
    | z.core.$ZodBoolean
    | z.core.$ZodNull
    | z.core.$ZodDate
    | z.core.$ZodLiteral
    | z.core.$ZodOptional<z.core.$ZodType>
    | z.core.$ZodTuple<z.core.$ZodType[]>
    | z.core.$ZodUnion<z.core.$ZodType[]>
    | (z.core.$ZodCustom<any, any> & { builtin: any }),
) {
  if (isCoValueClass(schema)) {
    return coField.ref(schema);
  } else {
    if ("_zod" in schema) {
      if (schema._zod.def.type === "optional") {
        const inner = zodSchemaToCoSchema(schema._zod.def.innerType);
        if (isCoValueClass(inner)) {
          return coField.ref(inner, { optional: true });
        } else {
          return fieldDef(inner);
        }
      } else if (schema._zod.def.type === "string") {
        return coField.string;
      } else if (schema._zod.def.type === "number") {
        return coField.number;
      } else if (schema._zod.def.type === "boolean") {
        return coField.boolean;
      } else if (schema._zod.def.type === "null") {
        return coField.null;
      } else if (schema._zod.def.type === "date") {
        return coField.Date;
      } else if (schema._zod.def.type === "literal") {
        if (
          schema._zod.def.values.some(
            (literal) => typeof literal === "undefined",
          )
        ) {
          throw new Error("z.literal() with undefined is not supported");
        }
        if (schema._zod.def.values.some((literal) => literal === null)) {
          throw new Error("z.literal() with null is not supported");
        }
        if (
          schema._zod.def.values.some((literal) => typeof literal === "bigint")
        ) {
          throw new Error("z.literal() with bigint is not supported");
        }
        return coField.literal(
          ...(schema._zod.def.values as Exclude<
            (typeof schema._zod.def.values)[number],
            undefined | null | bigint
          >[]),
        );
      } else if (schema._zod.def.type === "tuple") {
        return coField.json();
      } else if (schema._zod.def.type === "custom") {
        if ("builtin" in schema) {
          return fieldDef(schema.builtin);
        } else {
          throw new Error(`Unsupported custom zod type`);
        }
      } else if (schema._zod.def.type === "union") {
        if (
          schema._zod.def.options.every(
            (o) => "collaborative" in o && o.collaborative,
          )
        ) {
          if (!schema._zod.disc || schema._zod.disc.size == 0) {
            throw new Error(
              "z.union() of collaborative types is not supported, use z.discriminatedUnion() instead",
            );
          } else if (schema._zod.disc.size > 1) {
            throw new Error(
              "z.discriminatedUnion() of collaborative types with more than one discriminator is not supported",
            );
          }
          const discriminatorKey = schema._zod.disc.keys().next().value!;
          if (typeof discriminatorKey !== "string") {
            throw new Error(
              "z.discriminatedUnion() of collaborative types with non-string discriminator is not supported",
            );
          }

          const optionsAsCoValueClassesByDiscriminator = new Map<
            string,
            CoValueClass<CoMap>
          >();

          for (const option of schema._zod.def.options) {
            const optionCoValueClass = zodSchemaToCoSchema(option);
            const schemaForDiscriminator = (option as z.core.$ZodObject)._zod
              .def.shape[discriminatorKey];
            const discriminatorDef = schemaForDiscriminator?._zod.def;
            if (!discriminatorDef || discriminatorDef.type !== "literal") {
              throw new Error("Discriminator must be a string literal");
            }
            if (
              (discriminatorDef as z.core.$ZodLiteralDef).values.length !== 1
            ) {
              throw new Error("Discriminator must have exactly one value");
            }
            const discriminatorValue = (
              discriminatorDef as z.core.$ZodLiteralDef
            ).values[0];
            if (typeof discriminatorValue !== "string") {
              throw new Error("Discriminator must be a string literal");
            }
            optionsAsCoValueClassesByDiscriminator.set(
              discriminatorValue,
              optionCoValueClass,
            );
          }

          return coField.ref<CoValueClass<CoMap>>((_raw: RawCoMap) => {
            const discriminator = _raw.get(discriminatorKey);
            if (typeof discriminator !== "string") {
              throw new Error("Discriminator must be a string");
            }
            const coValueClass =
              optionsAsCoValueClassesByDiscriminator.get(discriminator);
            if (!coValueClass) {
              throw new Error("Discriminator value not found");
            }
            return coValueClass;
          });
        } else if (
          schema._zod.def.options.every((o) => !("collaborative" in o))
        ) {
          return coField.json();
        } else {
          throw new Error(
            "z.union()/z.discriminatedUnion() of mixed collaborative and non-collaborative types is not supported",
          );
        }
      } else {
        throw new Error(
          `Unsupported zod type: ${(schema._zod.def as any).type}`,
        );
      }
    } else {
      throw new Error(`Unsupported zod type: ${schema}`);
    }
  }
}

export type zCoMapType = z.core.$ZodObject & { collaborative: true };
export type zCoListType = z.core.$ZodArray & { collaborative: true };

export type CoValueClassOrPrimitiveFromZodSchema<S extends z.core.$ZodType> =
  S extends zCoMapType
    ? CoMapClass<S["_zod"]["def"]["shape"]>
    : S extends zCoListType
      ? CoListClass<S["_zod"]["def"]["element"]>
      : S extends z.core.$ZodString
        ? S
        : never;

export type CoMapInstance<Shape extends z.core.$ZodLooseShape> = {
  -readonly [key in keyof Shape]: coField<InstanceOrPrimitive<Shape[key]>>;
} & CoMap;

export type CoMapClass<Shape extends z.core.$ZodLooseShape> = typeof CoMap &
  CoValueClass<CoMapInstance<Shape>> & {
    create: (
      init: Simplify<
        CoMapInit<{
          [key in keyof Shape]: InstanceOrPrimitive<Shape[key]>;
        }>
      >,
      options?:
        | {
            owner: Account | Group;
            unique?: CoValueUniqueness["uniqueness"];
          }
        | Account
        | Group,
    ) => CoMapInstance<Shape>;
    load<const R extends RefsToResolve<CoMapInstance<Shape>> = true>(
      id: ID<CoMapInstance<Shape>>,
      options?: {
        resolve?: RefsToResolveStrict<CoMapInstance<Shape>, R>;
        loadAs?: Account | AnonymousJazzAgent;
      },
    ): Promise<Resolved<CoMapInstance<Shape>, R> | null>;
    subscribe<const R extends RefsToResolve<CoMapInstance<Shape>> = true>(
      this: CoValueClass<CoMapInstance<Shape>>,
      id: ID<CoMapInstance<Shape>>,
      listener: (
        value: Resolved<CoMapInstance<Shape>, R>,
        unsubscribe: () => void,
      ) => void,
    ): () => void;
    subscribe<const R extends RefsToResolve<CoMapInstance<Shape>> = true>(
      this: CoValueClass<CoMapInstance<Shape>>,
      id: ID<CoMapInstance<Shape>>,
      options: SubscribeListenerOptions<CoMapInstance<Shape>, R>,
      listener: (
        value: Resolved<CoMapInstance<Shape>, R>,
        unsubscribe: () => void,
      ) => void,
    ): () => void;
    subscribe<const R extends RefsToResolve<CoMapInstance<Shape>>>(
      this: CoValueClass<CoMapInstance<Shape>>,
      id: ID<CoMapInstance<Shape>>,
      ...args: SubscribeRestArgs<CoMapInstance<Shape>, R>
    ): () => void;
    findUnique(
      unique: CoValueUniqueness["uniqueness"],
      ownerID: ID<Account> | ID<Group>,
      as?: Account | Group | AnonymousJazzAgent,
    ): ID<CoMapInstance<Shape>>;
  };

export type CoListInstance<T extends z.core.$ZodType> = CoList<
  coField<InstanceOrPrimitive<T>>
>;

export type CoListClass<T extends z.core.$ZodType> = typeof CoList<
  InstanceOrPrimitive<T>
> &
  CoValueClass<CoListInstance<T>> & {
    create(
      items: InstanceOrPrimitive<T>[],
      options?: { owner: Account | Group } | Account | Group,
    ): CoListInstance<T>;
    load<const R extends RefsToResolve<CoListInstance<T>> = true>(
      id: ID<CoListInstance<T>>,
      options?: {
        resolve?: RefsToResolveStrict<CoListInstance<T>, R>;
        loadAs?: Account | AnonymousJazzAgent;
      },
    ): Promise<Resolved<CoListInstance<T>, R> | null>;
    subscribe<const R extends RefsToResolve<CoListInstance<T>> = true>(
      id: ID<CoListInstance<T>>,
      listener: (
        value: Resolved<CoListInstance<T>, R>,
        unsubscribe: () => void,
      ) => void,
    ): () => void;
    subscribe<const R extends RefsToResolve<CoListInstance<T>> = true>(
      id: ID<CoListInstance<T>>,
      options: SubscribeListenerOptions<CoListInstance<T>, R>,
      listener: (
        value: Resolved<CoListInstance<T>, R>,
        unsubscribe: () => void,
      ) => void,
    ): () => void;
    subscribe<const R extends RefsToResolve<CoListInstance<T>>>(
      id: ID<CoListInstance<T>>,
      ...args: SubscribeRestArgs<CoListInstance<T>, R>
    ): () => void;
  };

export type CoValueOrZodSchema = CoValueClass | zCoMapType | zCoListType;
export type InstanceOrPrimitive<S extends CoValueClass | z.core.$ZodType> =
  S extends CoValueClass
    ? InstanceType<S>
    : S extends zCoMapType
      ? {
          [key in keyof S["_zod"]["def"]["shape"]]: coField<
            InstanceOrPrimitive<S["_zod"]["def"]["shape"][key]>
          >;
        } & (unknown extends S["_zod"]["outextra"][string]
          ? {}
          : {
              [key: string]: coField<S["_zod"]["outextra"][string]>;
            }) &
          CoMap
      : S extends zCoListType
        ? CoList<coField<InstanceOrPrimitive<S["_zod"]["def"]["element"]>>>
        : S extends z.core.$ZodOptional<infer Inner>
          ? InstanceOrPrimitive<Inner> | undefined
          : S extends z.core.$ZodString
            ? string
            : S extends z.core.$ZodNumber
              ? number
              : S extends z.core.$ZodLiteral<infer Literal>
                ? Literal
                : S extends z.core.$ZodDate
                  ? Date
                  : S extends z.core.$ZodTuple<infer Items>
                    ? { [key in keyof Items]: InstanceOrPrimitive<Items[key]> }
                    : S extends z.core.$ZodUnion<infer Members>
                      ? InstanceOrPrimitive<Members[number]>
                      : never;

export type Loaded<T extends zCoMapType | zCoListType> = Resolved<
  InstanceOrPrimitive<T>
>;
