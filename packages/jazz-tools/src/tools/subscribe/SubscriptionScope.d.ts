import type { LocalNode, RawCoValue } from "cojson";
import {
  CoList,
  CoMap,
  type CoValue,
  type ID,
  type RefEncoded,
  type RefsToResolve,
} from "../internal.js";
import { CoValueCoreSubscription } from "./CoValueCoreSubscription.js";
import { JazzError } from "./JazzError.js";
import type { SubscriptionValue, Unloaded } from "./types.js";
export declare class SubscriptionScope<D extends CoValue> {
  node: LocalNode;
  id: ID<D>;
  schema: RefEncoded<D>;
  childNodes: Map<string, SubscriptionScope<CoValue>>;
  childValues: Map<string, SubscriptionValue<any, any> | Unloaded>;
  value: SubscriptionValue<D, any> | Unloaded;
  childErrors: Map<string, JazzError>;
  validationErrors: Map<string, JazzError>;
  errorFromChildren: JazzError | undefined;
  subscription: CoValueCoreSubscription;
  dirty: boolean;
  resolve: RefsToResolve<any>;
  idsSubscribed: Set<string>;
  autoloaded: Set<string>;
  autoloadedKeys: Set<string>;
  skipInvalidKeys: Set<string>;
  totalValidTransactions: number;
  migrated: boolean;
  migrating: boolean;
  silenceUpdates: boolean;
  constructor(
    node: LocalNode,
    resolve: RefsToResolve<D>,
    id: ID<D>,
    schema: RefEncoded<D>,
  );
  updateValue(value: SubscriptionValue<D, any>): void;
  handleUpdate(update: RawCoValue | "unavailable"): void;
  computeChildErrors(): JazzError | undefined;
  handleChildUpdate: (
    id: string,
    value: SubscriptionValue<any, any> | Unloaded,
    key?: string,
  ) => void;
  shouldSendUpdates(): boolean;
  getCurrentValue(): D | null | undefined;
  triggerUpdate(): void;
  subscribers: Set<(value: SubscriptionValue<D, any>) => void>;
  subscribe(listener: (value: SubscriptionValue<D, any>) => void): () => void;
  setListener(listener: (value: SubscriptionValue<D, any>) => void): void;
  subscribeToKey(key: string): void;
  subscribeToId(id: string, descriptor: RefEncoded<any>): void;
  loadChildren(): boolean;
  loadCoMapKey(
    map: CoMap,
    key: string,
    depth: Record<string, any> | true,
  ): string | undefined;
  loadCoListKey(
    list: CoList,
    key: string,
    depth: Record<string, any> | true,
  ): string | undefined;
  loadChildNode(
    id: string,
    query: RefsToResolve<any>,
    descriptor: RefEncoded<any>,
    key?: string,
  ): void;
  destroy(): void;
}
