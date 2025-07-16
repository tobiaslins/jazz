import { CoValueUniqueness } from "cojson";
import {
  Account,
  type CoMap,
  CoMapSchemaDefinition,
  Group,
  ID,
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
import { AnyZodOrCoValueSchema, WithHelpers } from "../zodSchema.js";
import { CoreCoValueSchema } from "./CoValueSchema.js";

type CoRecordInit<
  K extends z.core.$ZodString<string>,
  V extends z.core.$ZodType,
> = {
  [key in z.output<K>]: V extends z.core.$ZodOptional<any>
    ? InstanceOrPrimitiveOfSchemaCoValuesNullable<V>
    : NonNullable<InstanceOrPrimitiveOfSchemaCoValuesNullable<V>>;
};

export interface CoRecordSchema<
  K extends z.core.$ZodString<string>,
  V extends AnyZodOrCoValueSchema,
> extends AnyCoRecordSchema<K, V> {
  create: (
    init: Simplify<CoRecordInit<K, V>>,
    options?:
      | {
          owner: Account | Group;
          unique?: CoValueUniqueness["uniqueness"];
        }
      | Account
      | Group,
  ) => {
    [key in z.output<K>]: InstanceOrPrimitiveOfSchema<V>;
  } & CoMap;

  load<
    const R extends RefsToResolve<
      CoRecordInstanceCoValuesNullable<K, V>
    > = true,
  >(
    id: ID<CoRecordInstanceCoValuesNullable<K, V>>,
    options?: {
      resolve?: RefsToResolveStrict<CoRecordInstanceCoValuesNullable<K, V>, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Resolved<CoRecordInstanceCoValuesNullable<K, V>, R> | null>;

  subscribe<
    const R extends RefsToResolve<
      CoRecordInstanceCoValuesNullable<K, V>
    > = true,
  >(
    id: ID<CoRecordInstanceCoValuesNullable<K, V>>,
    options: SubscribeListenerOptions<
      CoRecordInstanceCoValuesNullable<K, V>,
      R
    >,
    listener: (
      value: Resolved<CoRecordInstanceCoValuesNullable<K, V>, R>,
      unsubscribe: () => void,
    ) => void,
  ): () => void;

  findUnique(
    unique: CoValueUniqueness["uniqueness"],
    ownerID: ID<Account> | ID<Group>,
    as?: Account | Group | AnonymousJazzAgent,
  ): ID<CoRecordInstanceCoValuesNullable<K, V>>;

  /** @deprecated Define your helper methods separately, in standalone functions. */
  withHelpers<S extends AnyCoRecordSchema<K, V>, T extends object>(
    this: S,
    helpers: (Self: S) => T,
  ): WithHelpers<S, T>;
  getCoValueClass: () => typeof CoMap;
}

// less precise version to avoid circularity issues and allow matching against
export interface AnyCoRecordSchema<
  K extends z.core.$ZodString<string> = z.core.$ZodString<string>,
  V extends AnyZodOrCoValueSchema = z.core.$ZodType,
> extends CoreCoValueSchema,
    z.core.$ZodRecord<K, V> {
  builtin: "CoMap";
  getDefinition: () => CoMapSchemaDefinition;
  getZodSchema: () => z.core.$ZodRecord<K, V>;
}

export type CoRecordInstance<
  K extends z.core.$ZodString<string>,
  V extends AnyZodOrCoValueSchema,
> = {
  [key in z.output<K>]: InstanceOrPrimitiveOfSchema<V>;
} & CoMap;

export type CoRecordInstanceCoValuesNullable<
  K extends z.core.$ZodString<string>,
  V extends AnyZodOrCoValueSchema,
> = {
  [key in z.output<K>]: InstanceOrPrimitiveOfSchemaCoValuesNullable<V>;
} & CoMap;
