import type { CoValueUniqueness, RawCoValue } from "cojson";
import {
  type Account,
  AnonymousJazzAgent,
  CoValueOrZodSchema,
  type Group,
  Loaded,
  RefsToResolve,
  RefsToResolveStrict,
  ResolveQuery,
  ResolveQueryStrict,
  Resolved,
  SubscriptionScope,
  inspect,
} from "../internal.js";
/** @category Abstract interfaces */
export interface CoValueClass<Value extends CoValue = CoValue> {
  /** @ignore */
  new (...args: any[]): Value;
}
export interface CoValueFromRaw<V extends CoValue> {
  fromRaw(raw: V["_raw"]): V;
}
/** @category Abstract interfaces */
export interface CoValue {
  /** @category Content */
  readonly id: ID<this>;
  /** @category Type Helpers */
  _type: string;
  /** @category Collaboration */
  _owner: Account | Group;
  /** @category Internals */
  _raw: RawCoValue;
  /** @internal */
  _subscriptionScope?: SubscriptionScope<this>;
  /** @internal */
  readonly _loadedAs: Account | AnonymousJazzAgent;
  /** @category Stringifying & Inspection */
  toJSON(key?: string, seenAbove?: ID<CoValue>[]): any[] | object | string;
  /** @category Stringifying & Inspection */
  [inspect](): any;
}
export declare function isCoValue(value: any): value is CoValue;
export declare function isCoValueClass<V extends CoValue>(
  value: any,
): value is CoValueClass<V> & CoValueFromRaw<V>;
/**
 * IDs are unique identifiers for `CoValue`s.
 * Can be used with a type argument to refer to a specific `CoValue` type.
 *
 * @example
 *
 * ```ts
 * type AccountID = ID<Account>;
 * ```
 *
 * @category CoValues
 */
export type ID<T> = string;
export declare function loadCoValueWithoutMe<
  V extends CoValue,
  const R extends RefsToResolve<V>,
>(
  cls: CoValueClass<V>,
  id: ID<CoValue>,
  options?: {
    resolve?: RefsToResolveStrict<V, R>;
    loadAs?: Account | AnonymousJazzAgent;
  },
): Promise<Resolved<V, R> | null>;
export declare function loadCoValue<
  V extends CoValue,
  const R extends RefsToResolve<V>,
>(
  cls: CoValueClass<V>,
  id: ID<CoValue>,
  options: {
    resolve?: RefsToResolveStrict<V, R>;
    loadAs: Account | AnonymousJazzAgent;
  },
): Promise<Resolved<V, R> | null>;
export declare function ensureCoValueLoaded<
  V extends CoValue,
  const R extends RefsToResolve<V>,
>(
  existing: V,
  options?:
    | {
        resolve?: RefsToResolveStrict<V, R>;
      }
    | undefined,
): Promise<Resolved<V, R>>;
type SubscribeListener<V extends CoValue, R extends RefsToResolve<V>> = (
  value: Resolved<V, R>,
  unsubscribe: () => void,
) => void;
export type SubscribeListenerOptions<
  V extends CoValue,
  R extends RefsToResolve<V>,
> = {
  resolve?: RefsToResolveStrict<V, R>;
  loadAs?: Account | AnonymousJazzAgent;
  onUnauthorized?: () => void;
  onUnavailable?: () => void;
};
export type SubscribeRestArgs<V extends CoValue, R extends RefsToResolve<V>> =
  | [options: SubscribeListenerOptions<V, R>, listener: SubscribeListener<V, R>]
  | [listener: SubscribeListener<V, R>];
export declare function parseSubscribeRestArgs<
  V extends CoValue,
  R extends RefsToResolve<V>,
>(
  args: SubscribeRestArgs<V, R>,
): {
  options: SubscribeListenerOptions<V, R>;
  listener: SubscribeListener<V, R>;
};
export declare function subscribeToCoValueWithoutMe<
  V extends CoValue,
  const R extends RefsToResolve<V>,
>(
  cls: CoValueClass<V>,
  id: ID<CoValue>,
  options: SubscribeListenerOptions<V, R>,
  listener: SubscribeListener<V, R>,
): () => void;
export declare function subscribeToCoValue<
  V extends CoValue,
  const R extends RefsToResolve<V>,
>(
  cls: CoValueClass<V>,
  id: ID<CoValue>,
  options: {
    resolve?: RefsToResolveStrict<V, R>;
    loadAs: Account | AnonymousJazzAgent;
    onUnavailable?: () => void;
    onUnauthorized?: () => void;
    syncResolution?: boolean;
  },
  listener: SubscribeListener<V, R>,
): () => void;
/**
 * @deprecated Used for the React integration in the past, but we moved to use SubscriptionScope directly.
 *
 * Going to be removed in the next minor version.
 */
export declare function createCoValueObservable<
  S extends CoValueOrZodSchema,
  const R extends ResolveQuery<S>,
>(
  initialValue?: undefined | null,
): {
  getCurrentValue: () => Loaded<S, R> | null | undefined;
  subscribe: (
    cls: S,
    id: string,
    options: {
      loadAs: Account | AnonymousJazzAgent;
      resolve?: ResolveQueryStrict<S, R>;
      onUnavailable?: () => void;
      onUnauthorized?: () => void;
      syncResolution?: boolean;
    },
    listener: () => void,
  ) => () => void;
};
export declare function subscribeToExistingCoValue<
  V extends CoValue,
  const R extends RefsToResolve<V>,
>(
  existing: V,
  options:
    | {
        resolve?: RefsToResolveStrict<V, R>;
        onUnavailable?: () => void;
        onUnauthorized?: () => void;
      }
    | undefined,
  listener: SubscribeListener<V, R>,
): () => void;
export declare function isAccountInstance(
  instance: unknown,
): instance is Account;
export declare function isAnonymousAgentInstance(
  instance: unknown,
): instance is AnonymousJazzAgent;
export declare function parseCoValueCreateOptions(
  options:
    | {
        owner?: Account | Group;
        unique?: CoValueUniqueness["uniqueness"];
      }
    | Account
    | Group
    | undefined,
): {
  owner: Account | Group;
  uniqueness:
    | {
        uniqueness:
          | string
          | number
          | true
          | import("cojson").JsonValue[]
          | readonly import("cojson").JsonValue[]
          | import("cojson").JsonObject;
      }
    | undefined;
};
export declare function parseGroupCreateOptions(
  options:
    | {
        owner?: Account;
      }
    | Account
    | undefined,
): {
  owner: Account;
};
export {};
