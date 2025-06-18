import { SessionID } from "cojson";
import { ItemsSym } from "../internal.js";
import { type Account } from "./account.js";
import { CoFeedEntry } from "./coFeed.js";
import { type CoKeys } from "./coMap.js";
import { type CoValue, type ID } from "./interfaces.js";
type NotNull<T> = Exclude<T, null>;
export type RefsToResolve<
  V,
  DepthLimit extends number = 10,
  CurrentDepth extends number[] = [],
> =
  | boolean
  | (DepthLimit extends CurrentDepth["length"]
      ? any
      : V extends Array<infer Item>
        ?
            | {
                $each: RefsToResolve<
                  NotNull<Item>,
                  DepthLimit,
                  [0, ...CurrentDepth]
                >;
                $onError?: null;
              }
            | boolean
        : V extends {
              _type: "CoMap" | "Group" | "Account";
            }
          ?
              | ({
                  [Key in CoKeys<V> as NonNullable<V[Key]> extends CoValue
                    ? Key
                    : never]?: RefsToResolve<
                    NonNullable<V[Key]>,
                    DepthLimit,
                    [0, ...CurrentDepth]
                  >;
                } & {
                  $onError?: null;
                })
              | (ItemsSym extends keyof V
                  ? {
                      $each: RefsToResolve<
                        NonNullable<V[ItemsSym]>,
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
                      NotNull<Item>,
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
export type Resolved<
  T,
  R extends RefsToResolve<T> | undefined = true,
> = DeeplyLoaded<T, R, 10, []>;
type onErrorNullEnabled<Depth> = Depth extends {
  $onError: null;
}
  ? null
  : never;
export type DeeplyLoaded<
  V,
  Depth,
  DepthLimit extends number = 10,
  CurrentDepth extends number[] = [],
> = DepthLimit extends CurrentDepth["length"]
  ? V
  : Depth extends boolean | undefined
    ? V
    : [V] extends [Array<infer Item>]
      ? NotNull<Item> extends CoValue
        ? Depth extends {
            $each: infer ItemDepth;
          }
          ? // Deeply loaded CoList
            (
              | (NotNull<Item> &
                  DeeplyLoaded<
                    NotNull<Item>,
                    ItemDepth,
                    DepthLimit,
                    [0, ...CurrentDepth]
                  >)
              | onErrorNullEnabled<Depth["$each"]>
            )[] &
              V
          : never
        : V
      : [V] extends [
            {
              _type: "CoMap" | "Group" | "Account";
            },
          ]
        ? ItemsSym extends keyof V
          ? Depth extends {
              $each: infer ItemDepth;
            }
            ? // Deeply loaded Record-like CoMap
              {
                [key: string]:
                  | DeeplyLoaded<
                      NonNullable<V[ItemsSym]>,
                      ItemDepth,
                      DepthLimit,
                      [0, ...CurrentDepth]
                    >
                  | onErrorNullEnabled<Depth["$each"]>;
              } & V
            : never
          : keyof Depth extends never
            ? V
            : // Deeply loaded CoMap
              {
                -readonly [Key in keyof Depth]-?: Key extends CoKeys<V>
                  ? NonNullable<V[Key]> extends CoValue
                    ?
                        | DeeplyLoaded<
                            NonNullable<V[Key]>,
                            Depth[Key],
                            DepthLimit,
                            [0, ...CurrentDepth]
                          >
                        | (undefined extends V[Key] ? undefined : never)
                        | onErrorNullEnabled<Depth[Key]>
                    : never
                  : never;
              } & V
        : [V] extends [
              {
                _type: "CoStream";
                byMe: CoFeedEntry<infer Item> | undefined;
              },
            ]
          ? // Deeply loaded CoStream
            {
              byMe?: {
                value: NotNull<Item>;
              };
              inCurrentSession?: {
                value: NotNull<Item>;
              };
              perSession: {
                [key: SessionID]: {
                  value: NotNull<Item>;
                };
              };
            } & {
              [key: ID<Account>]: {
                value: NotNull<Item>;
              };
            } & V
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
export {};
