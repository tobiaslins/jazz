import {
  ZodArray,
  ZodTuple,
  ZodUnion,
  core,
  array as zodArray,
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
  // record,
  // intersection,
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

export function union<const T extends readonly NonCoZodType[]>(
  options: T,
  params?: string | core.$ZodUnionParams,
): ZodUnion<T> {
  return zodUnion(options, params);
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
