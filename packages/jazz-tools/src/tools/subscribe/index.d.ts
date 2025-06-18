import type { CoValue, RefEncoded } from "../internal.js";
import { SubscriptionScope } from "./SubscriptionScope.js";
export declare function getSubscriptionScope<D extends CoValue>(
  value: D,
): SubscriptionScope<D>;
/** Autoload internals */
/**
 * Given a coValue, access a child coValue by key
 *
 * By subscribing to a given key, the subscription will automatically react to the id changes
 * on that key (e.g. deleting the key value will result on unsubscribing from the id)
 */
export declare function accessChildByKey<D extends CoValue>(
  parent: D,
  childId: string,
  key: string,
): any;
/**
 * Given a coValue, access a child coValue by id
 *
 * By subscribing to a given id, the subscription becomes permanent and will unsubscribe
 * only when the root subscription scope is destroyed.
 *
 * Used for refs that never change (e.g. CoFeed entries, CoMap edits)
 */
export declare function accessChildById<D extends CoValue>(
  parent: D,
  childId: string,
  schema: RefEncoded<CoValue>,
): any;
