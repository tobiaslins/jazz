import { CoValueUniqueness, JsonValue, RawCoList, RawCoMap } from "cojson";
import z from "zod";
import { Account } from "../coValues/account.js";
import { CoList } from "../coValues/coList.js";
import { CoMap, CoMapInit, Simplify } from "../coValues/coMap.js";
import { Group } from "../coValues/group.js";
import {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SubscribeListenerOptions,
  SubscribeRestArgs,
  coField,
  isCoValueClass,
} from "../internal.js";

// conversion from zod to old jazz-tools schemas

export const co = {
  map: <Shape extends z.core.$ZodLooseShape>(
    shape: Shape,
  ): CoMapSchema<Shape> => {
    const objectSchema = z.object(shape).meta({
      collaborative: true,
    });

    type CleanedType = Pick<typeof objectSchema, "_zod" | "def" | "~standard">;

    const coMapSchema = objectSchema as unknown as CleanedType & {
      collaborative: true;
      create: CoMapClass<Shape>["create"];
    };

    coMapSchema.collaborative = true;
    coMapSchema.create = ((init: any, options: any) => {
      return (zodSchemaToCoSchema(coMapSchema) as any).create(init, options);
    }) as CoMapClass<Shape>["create"];

    return coMapSchema;
  },
  list: <T extends z.core.$ZodType>(element: T): CoListSchema<T> => {
    const arraySchema = z.array(element).meta({
      collaborative: true,
    });

    type CleanedType = Pick<typeof arraySchema, "_zod" | "def" | "~standard">;

    const coListSchema = arraySchema as unknown as CleanedType & {
      collaborative: true;
      create: CoListClass<T>["create"];
    };

    coListSchema.collaborative = true;
    coListSchema.create = ((items: any, options: any) => {
      return (zodSchemaToCoSchema(coListSchema) as any).create(items, options);
    }) as CoListClass<T>["create"];

    return coListSchema;
  },
};

export type CoMapSchema<Shape extends z.core.$ZodLooseShape> =
  z.core.$ZodObject<Shape> & {
    create: (
      init: Simplify<{
        [key in keyof Shape]: coField<InstanceOrPrimitive<Shape[key]>>;
      }>,
      options?:
        | {
            owner: Account | Group;
            unique?: CoValueUniqueness["uniqueness"];
          }
        | Account
        | Group,
    ) => {
      [key in keyof Shape]: coField<InstanceOrPrimitive<Shape[key]>>;
    } & CoMap;
    collaborative: true;
  };
export type CoListSchema<T extends z.core.$ZodType> = z.core.$ZodArray<T> & {
  collaborative: true;
  create: (
    items: InstanceOrPrimitive<T>[],
    options?: { owner: Account | Group } | Account | Group,
  ) => CoList<coField<InstanceOrPrimitive<T>>>;
};

let coSchemasForZodSchemas = new Map<z.core.$ZodType, CoValueClass>();

export function zodSchemaToCoSchema<S extends z.core.$ZodType>(
  schema: S,
): CoValueClassOrPrimitiveFromZodSchema<S> {
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
    } else {
      throw new Error(`Unsupported zod CoValue type: ${schema._zod.def.type}`);
    }
  } else {
    if (schema._zod.def.type === "string") {
      return schema as CoValueClassOrPrimitiveFromZodSchema<S>;
    } else {
      throw new Error(`Unsupported zod type: ${schema._zod.def.type}`);
    }
  }
}

export function fieldDef(schema: CoValueClass | z.core.$ZodString) {
  if (isCoValueClass(schema)) {
    return coField.ref(schema);
  } else {
    if ("_zod" in schema) {
      if (schema._zod.def.type === "string") {
        return coField.string;
      } else {
        throw new Error(`Unsupported zod type: ${schema._zod.def.type}`);
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
  [key in keyof Shape]: coField<InstanceOrPrimitive<Shape[key]>>;
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
        } & CoMap
      : S extends zCoListType
        ? CoList<coField<InstanceOrPrimitive<S["_zod"]["def"]["element"]>>>
        : S extends z.core.$ZodString
          ? string
          : never;

export type Loaded<T extends zCoMapType | zCoListType> = Resolved<
  InstanceOrPrimitive<T>
>;
