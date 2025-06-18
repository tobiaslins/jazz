import { RawCoValue } from "cojson";
import { CoValue } from "../internal.js";
export declare const coValuesCache: {
  get: <V extends CoValue>(raw: RawCoValue, compute: () => V) => V;
};
