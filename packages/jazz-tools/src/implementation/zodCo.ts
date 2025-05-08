import { CoValueUniqueness } from "cojson";
import z from "zod";
import {
  Account,
  AnonymousJazzAgent,
  CoListSchema,
  CoMapInstance,
  CoMapSchema,
  FileStream,
  FileStreamSchema,
  Group,
  ImageDefinition,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SubscribeListenerOptions,
  zodSchemaToCoSchema,
} from "../internal.js";

export const coMapDefiner = <Shape extends z.core.$ZodLooseShape>(
  shape: Shape,
): CoMapSchema<Shape> => {
  const objectSchema = z.object(shape).meta({
    collaborative: true,
  });

  type CleanedType = Pick<
    typeof objectSchema,
    "_zod" | "def" | "~standard" | "catchall"
  >;

  const coMapSchema = objectSchema as unknown as CleanedType & {
    collaborative: true;
    create: CoMapSchema<Shape>["create"];
    load: CoMapSchema<Shape>["load"];
    subscribe: CoMapSchema<Shape>["subscribe"];
    findUnique: CoMapSchema<Shape>["findUnique"];
    catchall: CoMapSchema<Shape>["catchall"];
    withHelpers: CoMapSchema<Shape>["withHelpers"];
  };

  coMapSchema.collaborative = true;

  coMapSchema.create = function (
    this: CoMapSchema<Shape>,
    init: any,
    options: any,
  ) {
    return (zodSchemaToCoSchema(this) as any).create(init, options);
  } as CoMapSchema<Shape>["create"];

  coMapSchema.load = function <
    R extends RefsToResolve<CoMapInstance<Shape>> = true,
  >(
    this: CoMapSchema<Shape>,
    id: string,
    options?: {
      resolve?: RefsToResolveStrict<CoMapInstance<Shape>, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ) {
    return (zodSchemaToCoSchema(this) as any).load(id, options);
  } as CoMapSchema<Shape>["load"];

  coMapSchema.subscribe = function <
    R extends RefsToResolve<CoMapInstance<Shape>> = true,
  >(
    this: CoMapSchema<Shape>,
    id: string,
    options: SubscribeListenerOptions<CoMapInstance<Shape>, R>,
    listener: (
      value: Resolved<CoMapInstance<Shape>, R>,
      unsubscribe: () => void,
    ) => void,
  ) {
    return (zodSchemaToCoSchema(this) as any).subscribe(id, options, listener);
  } as CoMapSchema<Shape>["subscribe"];

  coMapSchema.findUnique = function (
    this: CoMapSchema<Shape>,
    unique: CoValueUniqueness["uniqueness"],
    ownerID: string,
    as?: Account | Group | AnonymousJazzAgent,
  ) {
    return (zodSchemaToCoSchema(this) as any).findUnique(unique, ownerID, as);
  } as CoMapSchema<Shape>["findUnique"];

  const oldCatchall = coMapSchema.catchall;
  coMapSchema.catchall = function (
    this: CoMapSchema<Shape>,
    schema: z.core.$ZodType,
  ) {
    return { ...this, ...oldCatchall(schema) } as any;
  } as CoMapSchema<Shape>["catchall"] as any;

  coMapSchema.withHelpers = function (
    this: CoMapSchema<Shape>,
    helpers: object,
  ) {
    return { ...this, ...helpers };
  } as CoMapSchema<Shape>["withHelpers"];

  return coMapSchema as unknown as CoMapSchema<Shape>;
};

const coListDefiner = <T extends z.core.$ZodType>(
  element: T,
): CoListSchema<T> => {
  const arraySchema = z.array(element).meta({
    collaborative: true,
  });

  type CleanedType = Pick<typeof arraySchema, "_zod" | "def" | "~standard">;

  const coListSchema = arraySchema as unknown as CleanedType & {
    collaborative: true;
    create: CoListSchema<T>["create"];
  };

  coListSchema.collaborative = true;

  coListSchema.create = function (
    this: CoListSchema<T>,
    items: any,
    options: any,
  ) {
    return (zodSchemaToCoSchema(this) as any).create(items, options);
  } as CoListSchema<T>["create"];

  return coListSchema;
};

export const coFileStreamDefiner = (): FileStreamSchema => {
  const placeholderSchema = z.instanceof(FileStream);

  const fileStreamSchema = placeholderSchema as unknown as Pick<
    typeof placeholderSchema,
    "_zod" | "def" | "~standard"
  > & {
    collaborative: true;
    builtin: typeof FileStream;
    create: (typeof FileStream)["create"];
  };

  fileStreamSchema.collaborative = true;

  fileStreamSchema.create = function (options: any) {
    return FileStream.create(options);
  } as (typeof FileStream)["create"];

  fileStreamSchema.builtin = FileStream;

  return fileStreamSchema;
};

export const co = {
  map: coMapDefiner,
  list: coListDefiner,
  fileStream: coFileStreamDefiner,
  image: (): typeof ImageDefinition => {
    return ImageDefinition;
  },
};
