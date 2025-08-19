import { RawCoValue, Role } from "cojson";
import { RegisteredSchemas } from "../coValues/registeredSchemas.js";
import {
  CoValue,
  RefEncoded,
  instantiateRefEncodedFromRaw,
  isLocalNodeOwner,
} from "../internal.js";
import { coValuesCache } from "../lib/cache.js";
import { SubscriptionScope } from "./SubscriptionScope.js";

export function myRoleFromRawValue(raw: RawCoValue): Role | undefined {
  const rawOwner = raw.group;

  if (isLocalNodeOwner(rawOwner)) {
    return "admin";
  }

  const owner = coValuesCache.get(rawOwner, () =>
    RegisteredSchemas["Group"].fromRaw(rawOwner),
  );

  return owner.myRole();
}

export function createCoValue<D extends CoValue>(
  ref: RefEncoded<D>,
  raw: RawCoValue,
  subscriptionScope: SubscriptionScope<D>,
) {
  const freshValueInstance = instantiateRefEncodedFromRaw(ref, raw);

  Object.defineProperty(freshValueInstance.$jazz, "_subscriptionScope", {
    value: subscriptionScope,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  return {
    type: "loaded" as const,
    value: freshValueInstance,
    id: subscriptionScope.id,
  };
}
