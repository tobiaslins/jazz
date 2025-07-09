import {
  core,
  discriminatedUnion as zodDiscriminatedUnion,
  object as zodObject,
  optional as zodOptional,
  union as zodUnion,
  ZodDiscriminatedUnion,
  ZodObject,
  ZodOptional,
  ZodUnion,
} from "zod/v4";
import { util } from "zod/v4/core";
export {
  string,
  number,
  boolean,
  array,
  templateLiteral,
  json,
  tuple,
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
  //   intersection,
  //   record,
  int,
  type ZodOptional,
  type ZodReadonly,
  type ZodLazy,
  type ZodDefault,
  type ZodCatch,
  type output as infer,
  z,
} from "zod/v4";

type NonCoZodType = core.$ZodType & { collaborative?: false };

export function object<T extends Record<string, NonCoZodType>>(
  shape?: T,
  params?: string | core.$ZodObjectParams,
): ZodObject<util.Writeable<T> & {}, core.$strip> {
  return zodObject(shape, params);
}

export function optional<T extends NonCoZodType>(schema: T): ZodOptional<T> {
  return zodOptional(schema);
}

export function discriminatedUnion<
  T extends readonly [
    NonCoZodType & core.$ZodTypeDiscriminable,
    ...(NonCoZodType & core.$ZodTypeDiscriminable)[],
  ],
>(discriminator: string, schemas: T): ZodDiscriminatedUnion<T> {
  return zodDiscriminatedUnion(discriminator, schemas as any);
}

export function union<const T extends readonly NonCoZodType[]>(
  options: T,
  params?: string | core.$ZodUnionParams,
): ZodUnion<T> {
  return zodUnion(options, params);
}
