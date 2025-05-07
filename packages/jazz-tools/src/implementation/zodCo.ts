import z from "zod";
import {
  CoListSchema,
  CoMapSchema,
  FileStream,
  ImageDefinition,
  zodSchemaToCoSchema,
} from "../internal.js";

export const co = {
  map: <Shape extends z.core.$ZodLooseShape>(
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

    return coMapSchema;
  },
  list: <T extends z.core.$ZodType>(element: T): CoListSchema<T> => {
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
  },
  fileStream: () => {
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
  },
  image: () => {
    return ImageDefinition;
  },
};
