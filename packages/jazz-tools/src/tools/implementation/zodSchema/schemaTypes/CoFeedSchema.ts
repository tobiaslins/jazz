import {
  Account,
  AnyZodOrCoValueSchema,
  CoFeed,
  Group,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SubscribeListenerOptions,
} from "../../../internal.js";
import { AnonymousJazzAgent } from "../../anonymousJazzAgent.js";
import { InstanceOfSchema } from "../typeConverters/InstanceOfSchema.js";
import { InstanceOrPrimitiveOfSchema } from "../typeConverters/InstanceOrPrimitiveOfSchema.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "../typeConverters/InstanceOrPrimitiveOfSchemaCoValuesNullable.js";
import { z } from "../zodReExport.js";

type CoFeedInit<T extends z.core.$ZodType> = Array<
  T extends z.core.$ZodOptional<any>
    ? InstanceOrPrimitiveOfSchemaCoValuesNullable<T>
    : NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>>
>;

export type CoFeedSchema<T extends AnyZodOrCoValueSchema> = AnyCoFeedSchema<T> & {
  create(
    init: CoFeedInit<T>,
    options?: { owner: Account | Group } | Account | Group,
  ): CoFeedInstance<T>;

  load<const R extends RefsToResolve<CoFeedInstanceCoValuesNullable<T>> = true>(
    id: string,
    options?: {
      resolve?: RefsToResolveStrict<CoFeedInstanceCoValuesNullable<T>, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Resolved<CoFeedInstanceCoValuesNullable<T>, R> | null>;

  subscribe(
    id: string,
    listener: (
      value: Resolved<CoFeedInstanceCoValuesNullable<T>, true>,
      unsubscribe: () => void,
    ) => void,
  ): () => void;
  subscribe<
    const R extends RefsToResolve<CoFeedInstanceCoValuesNullable<T>> = true,
  >(
    id: string,
    options: SubscribeListenerOptions<CoFeedInstanceCoValuesNullable<T>, R>,
    listener: (
      value: Resolved<CoFeedInstanceCoValuesNullable<T>, R>,
      unsubscribe: () => void,
    ) => void,
  ): () => void;

  getCoValueClass: () => typeof CoFeed;
};

export function createCoreCoFeedSchema<T extends AnyZodOrCoValueSchema>(
  element: T,
): AnyCoFeedSchema<T> {
  const zodSchema = z.instanceof(CoFeed).meta({
    collaborative: true,
  });
  return Object.assign(zodSchema, {
    collaborative: true as const,
    builtin: "CoFeed" as const,
    element,
    getZodSchema: () => zodSchema,
  });
}

export function enrichCoFeedSchema<T extends AnyZodOrCoValueSchema>(
  schema: AnyCoFeedSchema<T>,
  coValueClass: typeof CoFeed,
): CoFeedSchema<T> {
  return Object.assign(schema, {
    create: (...args: [any, ...any[]]) => {
      return coValueClass.create(...args);
    },
    load: (...args: [any, ...any[]]) => {
      // @ts-expect-error
      return coValueClass.load(...args);
    },
    subscribe: (...args: [any, ...any[]]) => {
      // @ts-expect-error
      return coValueClass.subscribe(...args);
    },
    withHelpers: (helpers: (Self: AnyCoFeedSchema<T>) => object) => {
      return Object.assign(schema, helpers(schema));
    },
    getCoValueClass: () => {
      return coValueClass;
    },
  }) as unknown as CoFeedSchema<T>;
}

// less precise version to avoid circularity issues and allow matching against
export type AnyCoFeedSchema<T extends AnyZodOrCoValueSchema = z.core.$ZodType> =
  z.core.$ZodCustom<CoFeed, unknown> & {
    collaborative: true;
    builtin: "CoFeed";
    element: T;
    getZodSchema: () => z.core.$ZodCustom<CoFeed, unknown>;
  };

export type CoFeedInstance<T extends AnyZodOrCoValueSchema> = CoFeed<
  InstanceOrPrimitiveOfSchema<T>
>;

export type CoFeedInstanceCoValuesNullable<T extends AnyZodOrCoValueSchema> =
  CoFeed<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>>;
