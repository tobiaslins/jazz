import type { RawCoList } from "cojson";
import type {
  Account,
  CoValue,
  CoValueClass,
  CoValueFromRaw,
  Group,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SchemaFor,
  SubscribeListenerOptions,
} from "../internal.js";
import { AnonymousJazzAgent, ItemsSym, Ref, inspect } from "../internal.js";
/**
 * CoLists are collaborative versions of plain arrays.
 *
 * @categoryDescription Content
 * You can access items on a `CoList` as if they were normal items on a plain array, using `[]` notation, etc.
 *
 * Since `CoList` is a subclass of `Array`, you can use all the normal array methods like `push`, `pop`, `splice`, etc.
 *
 * ```ts
 * colorList[0];
 * colorList[3] = "yellow";
 * colorList.push("Kawazaki Green");
 * colorList.splice(1, 1);
 * ```
 *
 * @category CoValues
 */
export declare class CoList<out Item = any>
  extends Array<Item>
  implements CoValue
{
  /**
   * Declare a `CoList` by subclassing `CoList.Of(...)` and passing the item schema using `co`.
   *
   * @example
   * ```ts
   * class ColorList extends CoList.Of(
   *   coField.string
   * ) {}
   * class AnimalList extends CoList.Of(
   *   coField.ref(Animal)
   * ) {}
   * ```
   *
   * @category Declaration
   */
  static Of<Item>(item: Item): typeof CoList<Item>;
  /**
   * @ignore
   * @deprecated Use UPPERCASE `CoList.Of` instead! */
  static of(..._args: never): never;
  /**
   * The ID of this `CoList`
   * @category Content */
  id: ID<this>;
  /** @category Type Helpers */
  _type: "CoList";
  /** @category Internals */
  _raw: RawCoList;
  /** @category Internals */
  _instanceID: string;
  /** @internal This is only a marker type and doesn't exist at runtime */
  [ItemsSym]: Item;
  /** @internal */
  static _schema: any;
  /** @internal */
  get _schema(): {
    [ItemsSym]: SchemaFor<Item> | any;
  };
  /** @category Collaboration */
  get _owner(): Account | Group;
  /**
   * If a `CoList`'s items are a `coField.ref(...)`, you can use `coList._refs[i]` to access
   * the `Ref` instead of the potentially loaded/null value.
   *
   * This allows you to always get the ID or load the value manually.
   *
   * @example
   * ```ts
   * animals._refs[0].id; // => ID<Animal>
   * animals._refs[0].value;
   * // => Animal | null
   * const animal = await animals._refs[0].load();
   * ```
   *
   * @category Content
   **/
  get _refs(): {
    [idx: number]: Exclude<Item, null> extends CoValue
      ? Ref<Exclude<Item, null>>
      : never;
  } & {
    length: number;
    [Symbol.iterator](): IterableIterator<
      Exclude<Item, null> extends CoValue ? Ref<Exclude<Item, null>> : never
    >;
  };
  get _edits(): {
    [idx: number]: {
      value?: Item;
      ref?: Item extends CoValue ? Ref<Item> : never;
      by: Account | null;
      madeAt: Date;
    };
  };
  get _loadedAs(): Account | AnonymousJazzAgent;
  static get [Symbol.species](): ArrayConstructor;
  getItemsDescriptor(): any;
  constructor(
    options:
      | {
          fromRaw: RawCoList;
        }
      | undefined,
  );
  /**
   * Create a new CoList with the given initial values and owner.
   *
   * The owner (a Group or Account) determines access rights to the CoMap.
   *
   * The CoList will immediately be persisted and synced to connected peers.
   *
   * @example
   * ```ts
   * const colours = ColorList.create(
   *   ["red", "green", "blue"],
   *   { owner: me }
   * );
   * const animals = AnimalList.create(
   *   [cat, dog, fish],
   *   { owner: me }
   * );
   * ```
   *
   * @category Creation
   **/
  static create<L extends CoList>(
    this: CoValueClass<L>,
    items: L[number][],
    options?:
      | {
          owner: Account | Group;
        }
      | Account
      | Group,
  ): L;
  push(...items: Item[]): number;
  unshift(...items: Item[]): number;
  pop(): Item | undefined;
  shift(): Item | undefined;
  /**
   * Splice the `CoList` at a given index.
   *
   * @param start - The index to start the splice.
   * @param deleteCount - The number of items to delete.
   * @param items - The items to insert.
   */
  splice(start: number, deleteCount: number, ...items: Item[]): Item[];
  /**
   * Modify the `CoList` to match another list, where the changes are managed internally.
   *
   * @param result - The resolved list of items.
   */
  applyDiff(result: Item[]): void;
  toJSON(_key?: string, seenAbove?: ID<CoValue>[]): any[];
  [inspect](): any[];
  /** @category Internals */
  static fromRaw<V extends CoList>(
    this: CoValueClass<V> & typeof CoList,
    raw: RawCoList,
  ): V & CoList<any>;
  /** @internal */
  static schema<V extends CoList>(
    this: {
      new (...args: any): V;
    } & typeof CoList,
    def: {
      [ItemsSym]: V["_schema"][ItemsSym];
    },
  ): void;
  /**
   * Load a `CoList` with a given ID, as a given account.
   *
   * `depth` specifies if item CoValue references should be loaded as well before resolving.
   * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
   *
   * You can pass `[]` or for shallowly loading only this CoList, or `[itemDepth]` for recursively loading referenced CoValues.
   *
   * Check out the `load` methods on `CoMap`/`CoList`/`CoFeed`/`Group`/`Account` to see which depth structures are valid to nest.
   *
   * @example
   * ```ts
   * const animalsWithVets =
   *   await ListOfAnimals.load(
   *     "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
   *     me,
   *     [{ vet: {} }]
   *   );
   * ```
   *
   * @category Subscription & Loading
   */
  static load<L extends CoList, const R extends RefsToResolve<L> = true>(
    this: CoValueClass<L>,
    id: ID<L>,
    options?: {
      resolve?: RefsToResolveStrict<L, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Resolved<L, R> | null>;
  /**
   * Load and subscribe to a `CoList` with a given ID, as a given account.
   *
   * Automatically also subscribes to updates to all referenced/nested CoValues as soon as they are accessed in the listener.
   *
   * `depth` specifies if item CoValue references should be loaded as well before calling `listener` for the first time.
   * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
   *
   * You can pass `[]` or for shallowly loading only this CoList, or `[itemDepth]` for recursively loading referenced CoValues.
   *
   * Check out the `load` methods on `CoMap`/`CoList`/`CoFeed`/`Group`/`Account` to see which depth structures are valid to nest.
   *
   * Returns an unsubscribe function that you should call when you no longer need updates.
   *
   * Also see the `useCoState` hook to reactively subscribe to a CoValue in a React component.
   *
   * @example
   * ```ts
   * const unsub = ListOfAnimals.subscribe(
   *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
   *   me,
   *   { vet: {} },
   *   (animalsWithVets) => console.log(animalsWithVets)
   * );
   * ```
   *
   * @category Subscription & Loading
   */
  static subscribe<L extends CoList, const R extends RefsToResolve<L> = true>(
    this: CoValueClass<L>,
    id: ID<L>,
    listener: (value: Resolved<L, R>, unsubscribe: () => void) => void,
  ): () => void;
  static subscribe<L extends CoList, const R extends RefsToResolve<L> = true>(
    this: CoValueClass<L>,
    id: ID<L>,
    options: SubscribeListenerOptions<L, R>,
    listener: (value: Resolved<L, R>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * Given an already loaded `CoList`, ensure that items are loaded to the specified depth.
   *
   * Works like `CoList.load()`, but you don't need to pass the ID or the account to load as again.
   *
   * @category Subscription & Loading
   */
  ensureLoaded<L extends CoList, const R extends RefsToResolve<L>>(
    this: L,
    options: {
      resolve: RefsToResolveStrict<L, R>;
    },
  ): Promise<Resolved<L, R>>;
  /**
   * Given an already loaded `CoList`, subscribe to updates to the `CoList` and ensure that items are loaded to the specified depth.
   *
   * Works like `CoList.subscribe()`, but you don't need to pass the ID or the account to load as again.
   *
   * Returns an unsubscribe function that you should call when you no longer need updates.
   *
   * @category Subscription & Loading
   **/
  subscribe<L extends CoList, const R extends RefsToResolve<L> = true>(
    this: L,
    listener: (value: Resolved<L, R>, unsubscribe: () => void) => void,
  ): () => void;
  subscribe<L extends CoList, const R extends RefsToResolve<L> = true>(
    this: L,
    options: {
      resolve?: RefsToResolveStrict<L, R>;
    },
    listener: (value: Resolved<L, R>, unsubscribe: () => void) => void,
  ): () => void;
  /** @category Type Helpers */
  castAs<Cl extends CoValueClass & CoValueFromRaw<CoValue>>(
    cl: Cl,
  ): InstanceType<Cl>;
  /**
   * Wait for the `CoList` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: {
    timeout?: number;
  }): Promise<unknown[]>;
}
