import {
  Account,
  CoList,
  Group,
  NotNull,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Simplify,
  SubscribeListenerOptions,
} from "../../../internal.js";
import { AnonymousJazzAgent } from "../../anonymousJazzAgent.js";
import { InstanceOrPrimitiveOfSchema } from "../typeConverters/InstanceOrPrimitiveOfSchema.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "../typeConverters/InstanceOrPrimitiveOfSchemaCoValuesNullable.js";
import { AnyZodOrCoValueSchema } from "../zodSchema.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

type CoListInit<T extends AnyZodOrCoValueSchema> = Simplify<
  Array<NotNull<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>>>
>;

export interface CoListSchema<T extends AnyZodOrCoValueSchema>
  extends CoreCoListSchema<T> {
  create: (
    items: CoListInit<T>,
    options?: { owner: Account | Group } | Account | Group,
  ) => CoList<InstanceOrPrimitiveOfSchema<T>>;

  load<const R extends RefsToResolve<CoListInstanceCoValuesNullable<T>> = true>(
    id: string,
    options?: {
      resolve?: RefsToResolveStrict<CoListInstanceCoValuesNullable<T>, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Resolved<CoListInstanceCoValuesNullable<T>, R> | null>;

  subscribe<
    const R extends RefsToResolve<CoListInstanceCoValuesNullable<T>> = true,
  >(
    id: string,
    options: SubscribeListenerOptions<CoListInstanceCoValuesNullable<T>, R>,
    listener: (
      value: Resolved<CoListInstanceCoValuesNullable<T>, R>,
      unsubscribe: () => void,
    ) => void,
  ): () => void;

  getCoValueClass: () => typeof CoList;
}

type CoListSchemaDefinition<
  T extends AnyZodOrCoValueSchema = AnyZodOrCoValueSchema,
> = {
  element: T;
};

export function createCoreCoListSchema<T extends AnyZodOrCoValueSchema>(
  element: T,
): CoreCoListSchema<T> {
  return {
    collaborative: true as const,
    builtin: "CoList" as const,
    element,
    getDefinition: () => ({
      element,
    }),
  };
}

export function enrichCoListSchema<T extends AnyZodOrCoValueSchema>(
  schema: CoreCoListSchema<T>,
  coValueClass: typeof CoList,
): CoListSchema<T> {
  return Object.assign(schema, {
    create: (...args: [any, ...any[]]) => {
      return coValueClass.create(...args);
    },
    load: (...args: [any, ...any[]]) => {
      return coValueClass.load(...args);
    },
    subscribe: (...args: [any, ...any[]]) => {
      // @ts-expect-error
      return coValueClass.subscribe(...args);
    },
    getCoValueClass: () => {
      return coValueClass;
    },
  }) as unknown as CoListSchema<T>;
}

// less precise version to avoid circularity issues and allow matching against
export interface CoreCoListSchema<
  T extends AnyZodOrCoValueSchema = AnyZodOrCoValueSchema,
> extends CoreCoValueSchema {
  builtin: "CoList";
  element: T;
  getDefinition: () => CoListSchemaDefinition<T>;
}

export type CoListInstance<T extends AnyZodOrCoValueSchema> = CoList<
  InstanceOrPrimitiveOfSchema<T>
>;

export type CoListInstanceCoValuesNullable<T extends AnyZodOrCoValueSchema> =
  CoList<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>>;
