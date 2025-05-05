import type { JsonValue, RawCoValue } from "cojson";
import { CojsonInternalTypes } from "cojson";
import {
  type CoValue,
  type CoValueClass,
  CoValueFromRaw,
  ItemsSym,
  JazzToolsSymbol,
  SchemaInit,
  isCoValueClass,
} from "../internal.js";

/** @category Schema definition */
export const Encoders = {
  Date: {
    encode: (value: Date) => value.toISOString(),
    decode: (value: JsonValue) => new Date(value as string),
  },
  OptionalDate: {
    encode: (value: Date | undefined) => value?.toISOString() || null,
    decode: (value: JsonValue) =>
      value === null ? undefined : new Date(value as string),
  },
};

export type CoFieldMarker = { readonly __co: unique symbol };
/** @category Schema definition */
export type coField<T> = T | (T & CoFieldMarker);
export type IfCoField<C, R> = C extends infer _A | infer B
  ? B extends CoFieldMarker
    ? R extends JazzToolsSymbol // Exclude symbol properties like co.items from the refs/init types
      ? never
      : R
    : never
  : never;
export type UnCoField<T> = T extends coField<infer A> ? A : T;

const optional = {
  ref: optionalRef,
  json<T extends CojsonInternalTypes.CoJsonValue<T>>(): coField<T | undefined> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { [SchemaInit]: "json" satisfies Schema } as any;
  },
  encoded<T>(arg: OptionalEncoder<T>): coField<T | undefined> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { [SchemaInit]: { encoded: arg } satisfies Schema } as any;
  },
  string: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<string | undefined>,
  number: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<number | undefined>,
  boolean: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<boolean | undefined>,
  null: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<null | undefined>,
  Date: {
    [SchemaInit]: { encoded: Encoders.OptionalDate } satisfies Schema,
  } as unknown as coField<Date | undefined>,
  literal<T extends (string | number | boolean)[]>(
    ..._lit: T
  ): coField<T[number] | undefined> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { [SchemaInit]: "json" satisfies Schema } as any;
  },
};

/** @category Schema definition */
export const coField = {
  string: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<string>,
  number: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<number>,
  boolean: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<boolean>,
  null: {
    [SchemaInit]: "json" satisfies Schema,
  } as unknown as coField<null>,
  Date: {
    [SchemaInit]: { encoded: Encoders.Date } satisfies Schema,
  } as unknown as coField<Date>,
  literal<T extends (string | number | boolean)[]>(
    ..._lit: T
  ): coField<T[number]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { [SchemaInit]: "json" satisfies Schema } as any;
  },
  json<T extends CojsonInternalTypes.CoJsonValue<T>>(): coField<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { [SchemaInit]: "json" satisfies Schema } as any;
  },
  encoded<T>(arg: Encoder<T>): coField<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { [SchemaInit]: { encoded: arg } satisfies Schema } as any;
  },
  ref,
  items: ItemsSym as ItemsSym,
  optional,
};

function optionalRef<C extends CoValueClass>(
  arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
): coField<InstanceType<C> | null | undefined> {
  return ref(arg, { optional: true });
}

function ref<C extends CoValueClass>(
  arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
  options?: never,
): coField<InstanceType<C> | null>;
function ref<C extends CoValueClass>(
  arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
  options: { optional: true },
): coField<InstanceType<C> | null | undefined>;
function ref<
  C extends CoValueClass,
  Options extends { optional?: boolean } | undefined,
>(
  arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
  options?: Options,
): Options extends { optional: true }
  ? coField<InstanceType<C> | null | undefined>
  : coField<InstanceType<C> | null> {
  return {
    [SchemaInit]: {
      ref: arg,
      optional: options?.optional || false,
    } satisfies Schema,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

export type JsonEncoded = "json";
export type EncodedAs<V> = { encoded: Encoder<V> | OptionalEncoder<V> };
export type RefEncoded<V extends CoValue> = {
  ref: CoValueClass<V> | ((raw: RawCoValue) => CoValueClass<V>);
  optional: boolean;
};

export function isRefEncoded<V extends CoValue>(
  schema: Schema,
): schema is RefEncoded<V> {
  return (
    typeof schema === "object" &&
    "ref" in schema &&
    "optional" in schema &&
    typeof schema.ref === "function"
  );
}

export function instantiateRefEncoded<V extends CoValue>(
  schema: RefEncoded<V>,
  raw: RawCoValue,
): V {
  return isCoValueClass<V>(schema.ref)
    ? schema.ref.fromRaw(raw)
    : (schema.ref as (raw: RawCoValue) => CoValueClass<V> & CoValueFromRaw<V>)(
        raw,
      ).fromRaw(raw);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Schema = JsonEncoded | RefEncoded<CoValue> | EncodedAs<any>;

export type SchemaFor<Field> = NonNullable<Field> extends CoValue
  ? RefEncoded<NonNullable<Field>>
  : NonNullable<Field> extends JsonValue
    ? JsonEncoded
    : EncodedAs<NonNullable<Field>>;

export type Encoder<V> = {
  encode: (value: V) => JsonValue;
  decode: (value: JsonValue) => V;
};
export type OptionalEncoder<V> =
  | Encoder<V>
  | {
      encode: (value: V | undefined) => JsonValue;
      decode: (value: JsonValue) => V | undefined;
    };
