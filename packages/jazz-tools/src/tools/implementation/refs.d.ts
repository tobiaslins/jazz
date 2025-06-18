import { type Account } from "../coValues/account.js";
import type {
  AnonymousJazzAgent,
  CoValue,
  ID,
  RefEncoded,
} from "../internal.js";
export declare class Ref<out V extends CoValue> {
  readonly id: ID<V>;
  readonly controlledAccount: Account | AnonymousJazzAgent;
  readonly schema: RefEncoded<V>;
  readonly parent: CoValue;
  constructor(
    id: ID<V>,
    controlledAccount: Account | AnonymousJazzAgent,
    schema: RefEncoded<V>,
    parent: CoValue,
  );
  load(): Promise<V | null>;
  get value(): V | null | undefined;
}
export declare function makeRefs<Keys extends string | number>(
  parent: CoValue,
  getIdForKey: (key: Keys) => ID<CoValue> | undefined,
  getKeysWithIds: () => Keys[],
  controlledAccount: Account | AnonymousJazzAgent,
  refSchemaForKey: (key: Keys) => RefEncoded<CoValue>,
): {
  [K in Keys]: Ref<CoValue>;
} & {
  [Symbol.iterator]: () => IterableIterator<Ref<CoValue>>;
  length: number;
};
export type RefIfCoValue<V> = NonNullable<V> extends CoValue
  ? Ref<NonNullable<V>>
  : never;
