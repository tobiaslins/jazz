import type { JsonValue, RawCoValue } from "cojson";
import { CojsonInternalTypes } from "cojson";
import { type CoValue, type CoValueClass, ItemsSym } from "../internal.js";
/** @category Schema definition */
export declare const Encoders: {
  Date: {
    encode: (value: Date) => string;
    decode: (value: JsonValue) => Date;
  };
  OptionalDate: {
    encode: (value: Date | undefined) => string | null;
    decode: (value: JsonValue) => Date | undefined;
  };
};
/** @category Schema definition */
export declare const coField: {
  string: string;
  number: number;
  boolean: boolean;
  null: null;
  Date: Date;
  literal<T extends (string | number | boolean)[]>(..._lit: T): T[number];
  json<T extends CojsonInternalTypes.CoJsonValue<T>>(): T;
  encoded<T>(arg: Encoder<T>): T;
  ref: typeof ref;
  items: ItemsSym;
  optional: {
    ref: typeof optionalRef;
    json<T extends CojsonInternalTypes.CoJsonValue<T>>(): T | undefined;
    encoded<T>(arg: OptionalEncoder<T>): T | undefined;
    string: string | undefined;
    number: number | undefined;
    boolean: boolean | undefined;
    null: null | undefined;
    Date: Date | undefined;
    literal<T extends (string | number | boolean)[]>(
      ..._lit: T
    ): T[number] | undefined;
  };
};
declare function optionalRef<C extends CoValueClass>(
  arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
): InstanceType<C> | null | undefined;
declare function ref<C extends CoValueClass>(
  arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
  options?: never,
): InstanceType<C> | null;
declare function ref<C extends CoValueClass>(
  arg: C | ((_raw: InstanceType<C>["_raw"]) => C),
  options: {
    optional: true;
  },
): InstanceType<C> | null | undefined;
export type JsonEncoded = "json";
export type EncodedAs<V> = {
  encoded: Encoder<V> | OptionalEncoder<V>;
};
export type RefEncoded<V extends CoValue> = {
  ref: CoValueClass<V> | ((raw: RawCoValue) => CoValueClass<V>);
  optional: boolean;
};
export declare function isRefEncoded<V extends CoValue>(
  schema: Schema,
): schema is RefEncoded<V>;
export declare function instantiateRefEncoded<V extends CoValue>(
  schema: RefEncoded<V>,
  raw: RawCoValue,
): V;
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
export {};
