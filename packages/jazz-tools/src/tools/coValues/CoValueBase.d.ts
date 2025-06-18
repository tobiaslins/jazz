import { type RawCoValue } from "cojson";
import { z } from "../implementation/zodSchema/zodReExport.js";
import {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  ID,
  inspect,
} from "../internal.js";
import type {
  Account,
  Group,
  InstanceOfSchemaCoValuesNullable,
} from "../internal.js";
/** @internal */
export declare class CoValueBase implements CoValue {
  id: ID<this>;
  _type: string;
  _raw: RawCoValue;
  /** @category Internals */
  _instanceID: string;
  get _owner(): Account | Group;
  /** @private */
  get _loadedAs(): Account | AnonymousJazzAgent;
  constructor(..._args: any);
  /** @category Internals */
  static fromRaw<V extends CoValue>(this: CoValueClass<V>, raw: RawCoValue): V;
  toJSON(): object | any[] | string;
  [inspect](): string | object | any[];
  /** @category Type Helpers */
  castAs<
    S extends
      | CoValueClass
      | z.core.$ZodType
      | (z.core.$ZodObject<any, any> & {
          builtin: "Account";
          migration?: (
            account: any,
            creationProps?: {
              name: string;
            },
          ) => void;
        })
      | (z.core.$ZodCustom<any, any> & {
          builtin: "FileStream";
        })
      | (z.core.$ZodCustom<any, any> & {
          builtin: "CoFeed";
          element: z.core.$ZodType;
        }),
  >(
    schema: S,
  ): S extends CoValueClass
    ? InstanceType<S>
    : S extends z.core.$ZodType
      ? NonNullable<InstanceOfSchemaCoValuesNullable<S>>
      : never;
}
