import { RawCoValue } from "cojson";
import { CoValue, RefEncoded } from "../internal.js";
import { SubscriptionScope } from "./SubscriptionScope.js";
export declare function getOwnerFromRawValue(
  raw: RawCoValue,
): import("../internal.js").Account | import("../internal.js").Group;
export declare function createCoValue<D extends CoValue>(
  ref: RefEncoded<D>,
  raw: RawCoValue,
  subscriptionScope: SubscriptionScope<D>,
): {
  type: "loaded";
  value: D;
  id: string;
};
