import { SessionID } from "cojson";
import { ItemsSym, UnCo } from "../internal.js";
import { type Account } from "./account.js";
import { CoFeedEntry } from "./coFeed.js";
import { type CoKeys, type CoMap } from "./coMap.js";
import { type CoValue, type ID } from "./interfaces.js";

type UnCoNotNull<T> = UnCo<Exclude<T, null>>;
export type Clean<T> = UnCo<NonNullable<T>>;

export type RefsToResolve<
  V,
  DepthLimit extends number = 10,
  CurrentDepth extends number[] = [],
> =
  | boolean
  | (DepthLimit extends CurrentDepth["length"]
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      : // Basically V extends CoList - but if we used that we'd introduce circularity into the definition of CoList itself
        V extends Array<infer Item>
        ?
            | {
                $each: RefsToResolve<
                  UnCoNotNull<Item>,
                  DepthLimit,
                  [0, ...CurrentDepth]
                >;
                $onError?: null;
              }
            | boolean
        : // Basically V extends CoMap | Group | Account - but if we used that we'd introduce circularity into the definition of CoMap itself
          V extends { _type: "CoMap" | "Group" | "Account" }
          ?
              | ({
                  [Key in CoKeys<V> as Clean<V[Key]> extends CoValue
                    ? Key
                    : never]?: RefsToResolve<
                    Clean<V[Key]>,
                    DepthLimit,
                    [0, ...CurrentDepth]
                  >;
                } & { $onError?: null })
              | (ItemsSym extends keyof V
                  ? {
                      $each: RefsToResolve<
                        Clean<V[ItemsSym]>,
                        DepthLimit,
                        [0, ...CurrentDepth]
                      >;
                      $onError?: null;
                    }
                  : never)
              | boolean
          : V extends {
                _type: "CoStream";
                byMe: CoFeedEntry<infer Item> | undefined;
              }
            ?
                | {
                    $each: RefsToResolve<
                      UnCoNotNull<Item>,
                      DepthLimit,
                      [0, ...CurrentDepth]
                    >;
                    $onError?: null;
                  }
                | boolean
            : boolean);

export type RefsToResolveStrict<T, V> = V extends RefsToResolve<T>
  ? RefsToResolve<T>
  : V;

export type Resolved<T, R extends RefsToResolve<T> | undefined> = DeeplyLoaded<
  T,
  R,
  10,
  []
>;

type onErrorNullEnabled<Depth> = Depth extends { $onError: null }
  ? null
  : never;

export type DeeplyLoaded<
  V,
  Depth,
  DepthLimit extends number = 10,
  CurrentDepth extends number[] = [],
> = DepthLimit extends CurrentDepth["length"]
  ? V
  : Depth extends boolean | undefined // Checking against boolean instead of true because the inference from RefsToResolveStrict transforms true into boolean
    ? V
    : // Basically V extends CoList - but if we used that we'd introduce circularity into the definition of CoList itself
      [V] extends [Array<infer Item>]
      ? UnCoNotNull<Item> extends CoValue
        ? Depth extends { $each: infer ItemDepth }
          ? // Deeply loaded CoList
            (
              | (Clean<Item> &
                  DeeplyLoaded<
                    Clean<Item>,
                    ItemDepth,
                    DepthLimit,
                    [0, ...CurrentDepth]
                  >)
              | onErrorNullEnabled<Depth["$each"]>
            )[] &
              V // the CoList base type needs to be intersected after so that built-in methods return the correct narrowed array type
          : never
        : V
      : // Basically V extends CoMap | Group | Account - but if we used that we'd introduce circularity into the definition of CoMap itself
        [V] extends [{ _type: "CoMap" | "Group" | "Account" }]
        ? ItemsSym extends keyof V
          ? Depth extends { $each: infer ItemDepth }
            ? // Deeply loaded Record-like CoMap
              {
                [key: string]:
                  | DeeplyLoaded<
                      Clean<V[ItemsSym]>,
                      ItemDepth,
                      DepthLimit,
                      [0, ...CurrentDepth]
                    >
                  | onErrorNullEnabled<ItemDepth>;
              } & V // same reason as in CoList
            : never
          : keyof Depth extends never // Depth = {}
            ? V
            : Depth extends { $onError: null }
              ? V
              : // Deeply loaded CoMap
                {
                  -readonly [Key in Exclude<
                    keyof Depth,
                    "$onError"
                  >]-?: Key extends CoKeys<V>
                    ? Clean<V[Key]> extends CoValue
                      ?
                          | DeeplyLoaded<
                              Clean<V[Key]>,
                              Depth[Key],
                              DepthLimit,
                              [0, ...CurrentDepth]
                            >
                          | (undefined extends V[Key] ? undefined : never)
                          | onErrorNullEnabled<Depth[Key]>
                      : never
                    : never;
                } & V // same reason as in CoList
        : [V] extends [
              {
                _type: "CoStream";
                byMe: CoFeedEntry<infer Item> | undefined;
              },
            ]
          ? // Deeply loaded CoStream
            {
              byMe?: { value: UnCoNotNull<Item> };
              inCurrentSession?: { value: UnCoNotNull<Item> };
              perSession: {
                [key: SessionID]: { value: UnCoNotNull<Item> };
              };
            } & { [key: ID<Account>]: { value: UnCoNotNull<Item> } } & V // same reason as in CoList
          : [V] extends [
                {
                  _type: "BinaryCoStream";
                },
              ]
            ? V
            : [V] extends [
                  {
                    _type: "CoPlainText";
                  },
                ]
              ? V
              : never;
