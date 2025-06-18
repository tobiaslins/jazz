import {
  AgentID,
  type CoValueUniqueness,
  CojsonInternalTypes,
  type JsonValue,
  RawAccountID,
  type RawCoMap,
} from "cojson";
import type {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  Group,
  ID,
  RefIfCoValue,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  Schema,
  SubscribeListenerOptions,
} from "../internal.js";
import { Account, CoValueBase, ItemsSym, Ref, inspect } from "../internal.js";
type CoMapEdit<V> = {
  value?: V;
  ref?: RefIfCoValue<V>;
  by: Account | null;
  madeAt: Date;
  key?: string;
};
type LastAndAllCoMapEdits<V> = CoMapEdit<V> & {
  all: CoMapEdit<V>[];
};
export type Simplify<A> = {
  [K in keyof A]: A[K];
} extends infer B
  ? B
  : never;
/**
 * CoMaps are collaborative versions of plain objects, mapping string-like keys to values.
 *
 * @categoryDescription Declaration
 * Declare your own CoMap schemas by subclassing `CoMap` and assigning field schemas with `co`.
 *
 * Optional `coField.ref(...)` fields must be marked with `{ optional: true }`.
 *
 * ```ts
 * import { coField, CoMap } from "jazz-tools";
 *
 * class Person extends CoMap {
 *   name = coField.string;
 *   age = coField.number;
 *   pet = coField.ref(Animal);
 *   car = coField.ref(Car, { optional: true });
 * }
 * ```
 *
 * @categoryDescription Content
 * You can access properties you declare on a `CoMap` (using `co`) as if they were normal properties on a plain object, using dot notation, `Object.keys()`, etc.
 *
 * ```ts
 * person.name;
 * person["age"];
 * person.age = 42;
 * person.pet?.name;
 * Object.keys(person);
 * // => ["name", "age", "pet"]
 * ```
 *
 * @category CoValues
 *  */
export declare class CoMap extends CoValueBase implements CoValue {
  /**
   * The ID of this `CoMap`
   * @category Content */
  id: ID<this>;
  /** @category Type Helpers */
  _type: "CoMap";
  /** @category Internals */
  _raw: RawCoMap;
  /** @internal */
  static _schema: any;
  /** @internal */
  get _schema(): {
    [key: string]: Schema;
  } & {
    [ItemsSym]?: Schema;
  };
  /**
   * The timestamp of the creation time of the CoMap
   */
  get _createdAt(): number;
  /**
   * The timestamp of the last updated time of the CoMap
   */
  get _lastUpdatedAt(): number;
  /**
   * If property `prop` is a `coField.ref(...)`, you can use `coMaps._refs.prop` to access
   * the `Ref` instead of the potentially loaded/null value.
   *
   * This allows you to always get the ID or load the value manually.
   *
   * @example
   * ```ts
   * person._refs.pet.id; // => ID<Animal>
   * person._refs.pet.value;
   * // => Animal | null
   * const pet = await person._refs.pet.load();
   * ```
   *
   * @category Content
   **/
  get _refs(): Simplify<
    {
      [Key in CoKeys<this> as NonNullable<this[Key]> extends CoValue
        ? Key
        : never]?: RefIfCoValue<this[Key]>;
    } & {
      [Key in CoKeys<this> as this[Key] extends undefined
        ? never
        : this[Key] extends CoValue
          ? Key
          : never]: RefIfCoValue<this[Key]>;
    }
  >;
  /** @internal */
  getEditFromRaw(
    target: CoMap,
    rawEdit: {
      by: RawAccountID | AgentID;
      tx: CojsonInternalTypes.TransactionID;
      at: Date;
      value?: JsonValue | undefined;
    },
    descriptor: Schema,
    key: string,
  ): {
    value: any;
    ref: Ref<CoValue> | undefined;
    readonly by: any;
    madeAt: Date;
    key: string;
  };
  /** @category Collaboration */
  get _edits(): { [Key in CoKeys<this>]?: LastAndAllCoMapEdits<this[Key]> };
  /** @internal */
  constructor(
    options:
      | {
          fromRaw: RawCoMap;
        }
      | undefined,
  );
  /**
   * Create a new CoMap with the given initial values and owner.
   *
   * The owner (a Group or Account) determines access rights to the CoMap.
   *
   * The CoMap will immediately be persisted and synced to connected peers.
   *
   * @example
   * ```ts
   * const person = Person.create({
   *   name: "Alice",
   *   age: 42,
   *   pet: cat,
   * }, { owner: friendGroup });
   * ```
   *
   * @category Creation
   **/
  static create<M extends CoMap>(
    this: CoValueClass<M>,
    init: Simplify<CoMapInit<M>>,
    options?:
      | {
          owner: Account | Group;
          unique?: CoValueUniqueness["uniqueness"];
        }
      | Account
      | Group,
  ): M;
  /**
   * Return a JSON representation of the `CoMap`
   * @category Content
   */
  toJSON(_key?: string, processedValues?: ID<CoValue>[]): any;
  [inspect](): any;
  /**
   * Create a new `RawCoMap` from an initialization object
   * @internal
   */
  rawFromInit<Fields extends object = Record<string, any>>(
    init: Simplify<CoMapInit<Fields>> | undefined,
    owner: Account | Group,
    uniqueness?: CoValueUniqueness,
  ): RawCoMap<
    {
      [key: string]: JsonValue | undefined;
    },
    import("cojson").JsonObject | null
  >;
  getDescriptor(key: string): Schema | undefined;
  /**
   * Declare a Record-like CoMap schema, by extending `CoMap.Record(...)` and passing the value schema using `co`. Keys are always `string`.
   *
   * @example
   * ```ts
   * import { coField, CoMap } from "jazz-tools";
   *
   * class ColorToFruitMap extends CoMap.Record(
   *  coField.ref(Fruit)
   * ) {}
   *
   * // assume we have map: ColorToFruitMap
   * // and strawberry: Fruit
   * map["red"] = strawberry;
   * ```
   *
   * @category Declaration
   */
  static Record<Value>(value: Value): {
    new (
      options:
        | {
            fromRaw: RawCoMap;
          }
        | undefined,
    ): {
      [x: string]: Value;
      $items$: Value;
      /**
       * The ID of this `CoMap`
       * @category Content */
      id: ID<this>;
      /** @category Type Helpers */
      _type: "CoMap";
      /** @category Internals */
      _raw: RawCoMap;
      /** @internal */
      readonly _schema: {
        [key: string]: Schema;
      } & {
        $items$?: Schema;
      };
      /**
       * The timestamp of the creation time of the CoMap
       */
      readonly _createdAt: number;
      /**
       * The timestamp of the last updated time of the CoMap
       */
      readonly _lastUpdatedAt: number;
      /**
       * If property `prop` is a `coField.ref(...)`, you can use `coMaps._refs.prop` to access
       * the `Ref` instead of the potentially loaded/null value.
       *
       * This allows you to always get the ID or load the value manually.
       *
       * @example
       * ```ts
       * person._refs.pet.id; // => ID<Animal>
       * person._refs.pet.value;
       * // => Animal | null
       * const pet = await person._refs.pet.load();
       * ```
       *
       * @category Content
       **/
      readonly _refs: Simplify<
        {
          [Key in string as NonNullable<any[Key]> extends CoValue
            ? Key
            : never]?: RefIfCoValue<any[Key]> | undefined;
        } & {
          [Key_1 in string as any[Key_1] extends undefined
            ? never
            : any[Key_1] extends CoValue
              ? Key_1
              : never]: RefIfCoValue<any[Key_1]>;
        }
      >;
      /** @internal */
      getEditFromRaw(
        target: CoMap,
        rawEdit: {
          by: RawAccountID | AgentID;
          tx: CojsonInternalTypes.TransactionID;
          at: Date;
          value?: JsonValue | undefined;
        },
        descriptor: Schema,
        key: string,
      ): {
        value: any;
        ref: Ref<CoValue> | undefined;
        readonly by: any;
        madeAt: Date;
        key: string;
      };
      /** @category Collaboration */
      readonly _edits: {
        [x: string]: LastAndAllCoMapEdits<Value> | undefined;
      };
      /**
       * Return a JSON representation of the `CoMap`
       * @category Content
       */
      toJSON(_key?: string, processedValues?: ID<CoValue>[]): any;
      /**
       * Create a new `RawCoMap` from an initialization object
       * @internal
       */
      rawFromInit<Fields extends object = Record<string, any>>(
        init: Simplify<CoMapInit<Fields>> | undefined,
        owner: Account | Group,
        uniqueness?: CoValueUniqueness,
      ): RawCoMap<
        {
          [key: string]: JsonValue | undefined;
        },
        import("cojson").JsonObject | null
      >;
      getDescriptor(key: string): Schema | undefined;
      /**
       * Given an already loaded `CoMap`, ensure that the specified fields are loaded to the specified depth.
       *
       * Works like `CoMap.load()`, but you don't need to pass the ID or the account to load as again.
       *
       * @category Subscription & Loading
       */
      ensureLoaded<M extends CoMap, const R extends RefsToResolve<M>>(
        this: M,
        options: {
          resolve: RefsToResolveStrict<M, R>;
        },
      ): Promise<Resolved<M, R>>;
      /**
       * Given an already loaded `CoMap`, subscribe to updates to the `CoMap` and ensure that the specified fields are loaded to the specified depth.
       *
       * Works like `CoMap.subscribe()`, but you don't need to pass the ID or the account to load as again.
       *
       * Returns an unsubscribe function that you should call when you no longer need updates.
       *
       * @category Subscription & Loading
       **/
      subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
        this: M,
        listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
      ): () => void;
      /**
       * Given an already loaded `CoMap`, subscribe to updates to the `CoMap` and ensure that the specified fields are loaded to the specified depth.
       *
       * Works like `CoMap.subscribe()`, but you don't need to pass the ID or the account to load as again.
       *
       * Returns an unsubscribe function that you should call when you no longer need updates.
       *
       * @category Subscription & Loading
       **/
      subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
        this: M,
        options: {
          resolve?: RefsToResolveStrict<M, R>;
        },
        listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
      ): () => void;
      applyDiff<N extends Partial<CoMapInit<any>>>(newValues: N): any;
      /**
       * Wait for the `CoMap` to be uploaded to the other peers.
       *
       * @category Subscription & Loading
       */
      waitForSync(options?: {
        timeout?: number;
      }): Promise<unknown[]>;
      [inspect](): any;
      _instanceID: string;
      readonly _owner: Account | Group;
      readonly _loadedAs: Account | AnonymousJazzAgent;
      castAs<
        S extends
          | CoValueClass
          | import("zod/v4/core/index.js").$ZodType
          | (import("zod/v4/core/index.js").$ZodObject<any, any> & {
              builtin: "Account";
              migration?: (
                account: any,
                creationProps?: {
                  name: string;
                },
              ) => void;
            })
          | (import("zod/v4/core/index.js").$ZodCustom<any, any> & {
              builtin: "FileStream";
            })
          | (import("zod/v4/core/index.js").$ZodCustom<any, any> & {
              builtin: "CoFeed";
              element: import("zod/v4/core/index.js").$ZodType;
            }),
      >(
        schema: S,
      ): S extends CoValueClass
        ? InstanceType<S>
        : S extends import("zod/v4/core/index.js").$ZodType
          ? NonNullable<
              import("../internal.js").InstanceOfSchemaCoValuesNullable<S>
            >
          : never;
    };
    /** @internal */
    _schema: any;
    /**
     * Create a new CoMap with the given initial values and owner.
     *
     * The owner (a Group or Account) determines access rights to the CoMap.
     *
     * The CoMap will immediately be persisted and synced to connected peers.
     *
     * @example
     * ```ts
     * const person = Person.create({
     *   name: "Alice",
     *   age: 42,
     *   pet: cat,
     * }, { owner: friendGroup });
     * ```
     *
     * @category Creation
     **/
    create<M extends CoMap>(
      this: CoValueClass<M>,
      init: Simplify<CoMapInit<M>>,
      options?:
        | {
            owner: Account | Group;
            unique?: CoValueUniqueness["uniqueness"];
          }
        | Account
        | Group,
    ): M;
    Record<Value>(value: Value): any;
    /**
     * Load a `CoMap` with a given ID, as a given account.
     *
     * `depth` specifies which (if any) fields that reference other CoValues to load as well before resolving.
     * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
     *
     * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
     *
     * Check out the `load` methods on `CoMap`/`CoList`/`CoFeed`/`Group`/`Account` to see which depth structures are valid to nest.
     *
     * @example
     * ```ts
     * const person = await Person.load(
     *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
     *   { pet: {} }
     * );
     * ```
     *
     * @category Subscription & Loading
     */
    load<M extends CoMap, const R extends RefsToResolve<M> = true>(
      this: CoValueClass<M>,
      id: ID<M>,
      options?: {
        resolve?: RefsToResolveStrict<M, R>;
        loadAs?: Account | AnonymousJazzAgent;
      },
    ): Promise<Resolved<M, R> | null>;
    /**
     * Load and subscribe to a `CoMap` with a given ID, as a given account.
     *
     * Automatically also subscribes to updates to all referenced/nested CoValues as soon as they are accessed in the listener.
     *
     * `depth` specifies which (if any) fields that reference other CoValues to load as well before calling `listener` for the first time.
     * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
     *
     * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
     *
     * Check out the `load` methods on `CoMap`/`CoList`/`CoFeed`/`Group`/`Account` to see which depth structures are valid to nest.
     *
     * Returns an unsubscribe function that you should call when you no longer need updates.
     *
     * Also see the `useCoState` hook to reactively subscribe to a CoValue in a React component.
     *
     * @example
     * ```ts
     * const unsub = Person.subscribe(
     *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
     *   { pet: {} },
     *   (person) => console.log(person)
     * );
     * ```
     *
     * @category Subscription & Loading
     */
    subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
      this: CoValueClass<M>,
      id: ID<M>,
      listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
    ): () => void;
    /**
     * Load and subscribe to a `CoMap` with a given ID, as a given account.
     *
     * Automatically also subscribes to updates to all referenced/nested CoValues as soon as they are accessed in the listener.
     *
     * `depth` specifies which (if any) fields that reference other CoValues to load as well before calling `listener` for the first time.
     * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
     *
     * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
     *
     * Check out the `load` methods on `CoMap`/`CoList`/`CoFeed`/`Group`/`Account` to see which depth structures are valid to nest.
     *
     * Returns an unsubscribe function that you should call when you no longer need updates.
     *
     * Also see the `useCoState` hook to reactively subscribe to a CoValue in a React component.
     *
     * @example
     * ```ts
     * const unsub = Person.subscribe(
     *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
     *   { pet: {} },
     *   (person) => console.log(person)
     * );
     * ```
     *
     * @category Subscription & Loading
     */
    subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
      this: CoValueClass<M>,
      id: ID<M>,
      options: SubscribeListenerOptions<M, R>,
      listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
    ): () => void;
    findUnique<M extends CoMap>(
      this: CoValueClass<M>,
      unique: CoValueUniqueness["uniqueness"],
      ownerID: ID<Account> | ID<Group>,
      as?: Account | Group | AnonymousJazzAgent,
    ): ID<M>;
    fromRaw<V extends CoValue>(
      this: CoValueClass<V>,
      raw: import("cojson").RawCoValue,
    ): V;
  };
  /**
   * Load a `CoMap` with a given ID, as a given account.
   *
   * `depth` specifies which (if any) fields that reference other CoValues to load as well before resolving.
   * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
   *
   * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
   *
   * Check out the `load` methods on `CoMap`/`CoList`/`CoFeed`/`Group`/`Account` to see which depth structures are valid to nest.
   *
   * @example
   * ```ts
   * const person = await Person.load(
   *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
   *   { pet: {} }
   * );
   * ```
   *
   * @category Subscription & Loading
   */
  static load<M extends CoMap, const R extends RefsToResolve<M> = true>(
    this: CoValueClass<M>,
    id: ID<M>,
    options?: {
      resolve?: RefsToResolveStrict<M, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Resolved<M, R> | null>;
  /**
   * Load and subscribe to a `CoMap` with a given ID, as a given account.
   *
   * Automatically also subscribes to updates to all referenced/nested CoValues as soon as they are accessed in the listener.
   *
   * `depth` specifies which (if any) fields that reference other CoValues to load as well before calling `listener` for the first time.
   * The `DeeplyLoaded` return type guarantees that corresponding referenced CoValues are loaded to the specified depth.
   *
   * You can pass `[]` or `{}` for shallowly loading only this CoMap, or `{ fieldA: depthA, fieldB: depthB }` for recursively loading referenced CoValues.
   *
   * Check out the `load` methods on `CoMap`/`CoList`/`CoFeed`/`Group`/`Account` to see which depth structures are valid to nest.
   *
   * Returns an unsubscribe function that you should call when you no longer need updates.
   *
   * Also see the `useCoState` hook to reactively subscribe to a CoValue in a React component.
   *
   * @example
   * ```ts
   * const unsub = Person.subscribe(
   *   "co_zdsMhHtfG6VNKt7RqPUPvUtN2Ax",
   *   { pet: {} },
   *   (person) => console.log(person)
   * );
   * ```
   *
   * @category Subscription & Loading
   */
  static subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
    this: CoValueClass<M>,
    id: ID<M>,
    listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
  ): () => void;
  static subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
    this: CoValueClass<M>,
    id: ID<M>,
    options: SubscribeListenerOptions<M, R>,
    listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
  ): () => void;
  static findUnique<M extends CoMap>(
    this: CoValueClass<M>,
    unique: CoValueUniqueness["uniqueness"],
    ownerID: ID<Account> | ID<Group>,
    as?: Account | Group | AnonymousJazzAgent,
  ): ID<M>;
  /**
   * Given an already loaded `CoMap`, ensure that the specified fields are loaded to the specified depth.
   *
   * Works like `CoMap.load()`, but you don't need to pass the ID or the account to load as again.
   *
   * @category Subscription & Loading
   */
  ensureLoaded<M extends CoMap, const R extends RefsToResolve<M>>(
    this: M,
    options: {
      resolve: RefsToResolveStrict<M, R>;
    },
  ): Promise<Resolved<M, R>>;
  /**
   * Given an already loaded `CoMap`, subscribe to updates to the `CoMap` and ensure that the specified fields are loaded to the specified depth.
   *
   * Works like `CoMap.subscribe()`, but you don't need to pass the ID or the account to load as again.
   *
   * Returns an unsubscribe function that you should call when you no longer need updates.
   *
   * @category Subscription & Loading
   **/
  subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
    this: M,
    listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
  ): () => void;
  subscribe<M extends CoMap, const R extends RefsToResolve<M> = true>(
    this: M,
    options: {
      resolve?: RefsToResolveStrict<M, R>;
    },
    listener: (value: Resolved<M, R>, unsubscribe: () => void) => void,
  ): () => void;
  applyDiff<N extends Partial<CoMapInit<this>>>(newValues: N): this;
  /**
   * Wait for the `CoMap` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: {
    timeout?: number;
  }): Promise<unknown[]>;
}
export type CoKeys<Map extends object> = Exclude<
  keyof Map & string,
  keyof CoMap
>;
/**
 * Force required ref fields to be non nullable
 *
 * Considering that:
 * - Optional refs are typed as coField<InstanceType<CoValueClass> | null | undefined>
 * - Required refs are typed as coField<InstanceType<CoValueClass> | null>
 *
 * This type works in two steps:
 * - Remove the null from both types
 * - Then we check if the input type accepts undefined, if positive we put the null union back
 *
 * So the optional refs stays unchanged while we safely remove the null union
 * from required refs
 *
 * This way required refs can be marked as required in the CoMapInit while
 * staying a nullable property for value access.
 *
 * Example:
 *
 * const map = MyCoMap.create({
 *   requiredRef: NestedMap.create({}) // null is not valid here
 * })
 *
 * map.requiredRef // this value is still nullable
 */
type ForceRequiredRef<V> = V extends InstanceType<CoValueClass> | null
  ? NonNullable<V>
  : V extends InstanceType<CoValueClass> | undefined
    ? V | null
    : V;
export type CoMapInit<Map extends object> = {
  [Key in CoKeys<Map> as undefined extends Map[Key]
    ? never
    : Key]: ForceRequiredRef<Map[Key]>;
} & {
  [Key in CoKeys<Map>]?: ForceRequiredRef<Map[Key]>;
};
export {};
