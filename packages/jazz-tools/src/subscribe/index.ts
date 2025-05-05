import type { CoValue, CoValueClass, RefEncoded } from "../internal.js";
import { SubscriptionScope } from "./SubscriptionScope.js";

export function getSubscriptionScope<D extends CoValue>(value: D) {
  const subscriptionScope = value._subscriptionScope;

  if (subscriptionScope) {
    return subscriptionScope;
  }

  const node = value._raw.core.node;
  const resolve = true;
  const id = value.id;

  const newSubscriptionScope = new SubscriptionScope(node, resolve, id, {
    ref: value.constructor as CoValueClass<D>,
    optional: false,
  });

  Object.defineProperty(value, "_subscriptionScope", {
    value: subscriptionScope,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return newSubscriptionScope;
}

/** Autoload internals */
export function accessChildByKey<D extends CoValue>(
  parent: D,
  childId: string,
  key: string,
) {
  const subscriptionScope = getSubscriptionScope(parent);

  subscriptionScope.subscribeToKey(key);

  const value = subscriptionScope.childValues.get(childId);

  if (value?.type === "loaded") {
    return value.value;
  } else {
    return null;
  }
}

export function accessChildById<D extends CoValue>(
  parent: D,
  childId: string,
  schema: RefEncoded<CoValue>,
) {
  const subscriptionScope = getSubscriptionScope(parent);

  subscriptionScope.subscribeToId(childId, schema);

  const value = subscriptionScope.childValues.get(childId);

  if (value?.type === "loaded") {
    return value.value;
  } else {
    return null;
  }
}
