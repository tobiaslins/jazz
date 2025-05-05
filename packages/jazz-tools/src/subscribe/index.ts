import type { CoValue, CoValueClass, RefEncoded } from "../internal.js";
import { CoValueResolutionNode } from "./CoValueResolutionNode.js";

export function getResolutionNode<D extends CoValue>(value: D) {
  const resolutionNode = value._resolutionNode;

  if (resolutionNode) {
    return resolutionNode;
  }

  const node = value._raw.core.node;
  const resolve = true;
  const id = value.id;

  const newResolutionNode = new CoValueResolutionNode(node, resolve, id, {
    ref: value.constructor as CoValueClass<D>,
    optional: false,
  });

  Object.defineProperty(value, "_resolutionNode", {
    value: resolutionNode,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return newResolutionNode;
}

/** Autoload internals */
export function accessChildByKey<D extends CoValue>(
  parent: D,
  childId: string,
  key: string,
) {
  const resolutionNode = getResolutionNode(parent);

  resolutionNode.subscribeToKey(key);

  const value = resolutionNode.childValues.get(childId);

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
  const resolutionNode = getResolutionNode(parent);

  resolutionNode.subscribeToId(childId, schema);

  const value = resolutionNode.childValues.get(childId);

  if (value?.type === "loaded") {
    return value.value;
  } else {
    return null;
  }
}
