import {
  ZodArray,
  ZodIntersection,
  ZodRecord,
  ZodTuple,
  ZodUnion,
  core,
  array as zodArray,
  intersection as zodIntersection,
  record as zodRecord,
  tuple as zodTuple,
  union as zodUnion,
} from "zod/v4";
export {
  string,
  number,
  boolean,
  object,
  templateLiteral,
  json,
  date,
  emoji,
  base64,
  base64url,
  nanoid,
  cuid,
  cuid2,
  ulid,
  ipv4,
  ipv6,
  email,
  url,
  uuid,
  literal,
  enum,
  cidrv4,
  cidrv6,
  iso,
  int32,
  strictObject,
  discriminatedUnion,
  int,
  optional,
  type ZodOptional,
  type ZodReadonly,
  type ZodLazy,
  type ZodDefault,
  type ZodCatch,
  type output as infer,
  z,
} from "zod/v4";

type NonCoZodType = core.$ZodType & { collaborative?: false };

export function record<
  Key extends core.$ZodRecordKey,
  Value extends NonCoZodType,
>(
  keyType: Key,
  valueType: Value,
  params?: string | core.$ZodRecordParams,
): ZodRecord<Key, Value> {
  return zodRecord(keyType, valueType, params);
}

export function union<const T extends readonly NonCoZodType[]>(
  options: T,
  params?: string | core.$ZodUnionParams,
): ZodUnion<T> {
  return zodUnion(options, params);
}

export function intersection<T extends NonCoZodType, U extends NonCoZodType>(
  left: T,
  right: U,
): ZodIntersection<T, U> {
  return zodIntersection(left, right);
}

export function array<T extends NonCoZodType>(
  element: T,
  params?: string | core.$ZodArrayParams,
): ZodArray<T> {
  return zodArray(element, params);
}

export function tuple<T extends readonly [NonCoZodType, ...NonCoZodType[]]>(
  options: T,
  params?: string | core.$ZodTupleParams,
): ZodTuple<T> {
  return zodTuple(options, params);
}
