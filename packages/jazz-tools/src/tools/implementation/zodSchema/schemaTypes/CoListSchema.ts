import {
  Account,
  CoList,
  Group,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Simplify,
  SubscribeListenerOptions,
} from "../../../internal.js";
import { AnonymousJazzAgent } from "../../anonymousJazzAgent.js";
import { InstanceOrPrimitiveOfSchema } from "../typeConverters/InstanceOrPrimitiveOfSchema.js";
import { InstanceOrPrimitiveOfSchemaCoValuesNullable } from "../typeConverters/InstanceOrPrimitiveOfSchemaCoValuesNullable.js";
import { z } from "../zodReExport.js";
import {
  AnyZodOrCoValueSchema,
  WithHelpers,
  ZodSchemaForAnySchema,
} from "../zodSchema.js";
import { CoreCoOptionalSchema } from "./CoOptionalSchema.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

type CoListInit<T extends AnyZodOrCoValueSchema> = Simplify<
  Array<
    T extends z.core.$ZodOptional<infer V2> | CoreCoOptionalSchema<infer V2>
      ? NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<V2>> | undefined
      : NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>>
  >
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

  /** @deprecated Define your helper methods separately, in standalone functions. */
  withHelpers<S extends CoreCoListSchema<T>, T2 extends object>(
    this: S,
    helpers: (Self: S) => T2,
  ): WithHelpers<S, T2>;

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
  const zodSchema = z.array(element as any).meta({
    collaborative: true,
  });
  return {
    collaborative: true as const,
    builtin: "CoList" as const,
    getDefinition: () => ({
      element: zodSchema.def.element,
    }),
    getZodSchema: () => zodSchema,
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
    withHelpers: (helpers: (Self: CoreCoListSchema<T>) => object) => {
      return Object.assign(schema, helpers(schema));
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
  getDefinition: () => CoListSchemaDefinition<T>;
  getZodSchema: () => z.core.$ZodArray<ZodSchemaForAnySchema<T>>;
}

export type CoListInstance<T extends AnyZodOrCoValueSchema> = CoList<
  InstanceOrPrimitiveOfSchema<T>
>;

export type CoListInstanceCoValuesNullable<T extends AnyZodOrCoValueSchema> =
  CoList<InstanceOrPrimitiveOfSchemaCoValuesNullable<T>>;
