import type {
  BinaryStreamInfo,
  CojsonInternalTypes,
  RawBinaryCoStream,
  RawCoStream,
  SessionID,
} from "cojson";
import type {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  Group,
  ID,
  RefsToResolve,
  RefsToResolveStrict,
  Resolved,
  SchemaFor,
  SubscribeListenerOptions,
} from "../internal.js";
import { Account, CoValueBase, ItemsSym, Ref, inspect } from "../internal.js";
/** @deprecated Use CoFeedEntry instead */
export type CoStreamEntry<Item> = CoFeedEntry<Item>;
export type CoFeedEntry<Item> = SingleCoFeedEntry<Item> & {
  all: IterableIterator<SingleCoFeedEntry<Item>>;
};
/** @deprecated Use SingleCoFeedEntry instead */
export type SingleCoStreamEntry<Item> = SingleCoFeedEntry<Item>;
export type SingleCoFeedEntry<Item> = {
  value: NonNullable<Item> extends CoValue ? NonNullable<Item> | null : Item;
  ref: NonNullable<Item> extends CoValue ? Ref<NonNullable<Item>> : never;
  by: Account | null;
  madeAt: Date;
  tx: CojsonInternalTypes.TransactionID;
};
/** @deprecated Use CoFeed instead */
export { CoFeed as CoStream };
/**
 * CoFeeds are collaborative logs of data.
 *
 * @categoryDescription Content
 * They are similar to `CoList`s, but with a few key differences:
 * - They are append-only
 * - They consist of several internal append-only logs, one per account session (tab, device, app instance, etc.)
 * - They expose those as a per-account aggregated view (default) or a precise per-session view
 *
 * ```ts
 * favDog.push("Poodle");
 * favDog.push("Schnowzer");
 * ```
 *
 * @category CoValues
 */
export declare class CoFeed<out Item = any>
  extends CoValueBase
  implements CoValue
{
  /**
   * Declare a `CoFeed` by subclassing `CoFeed.Of(...)` and passing the item schema using a `co` primitive or a `coField.ref`.
   *
   * @example
   * ```ts
   * class ColorFeed extends CoFeed.Of(coField.string) {}
   * class AnimalFeed extends CoFeed.Of(coField.ref(Animal)) {}
   * ```
   *
   * @category Declaration
   */
  static Of<Item>(item: Item): typeof CoFeed<Item>;
  /**
   * The ID of this `CoFeed`
   * @category Content */
  id: ID<this>;
  /** @category Type Helpers */
  _type: "CoStream";
  /** @category Internals */
  _raw: RawCoStream;
  /** @internal This is only a marker type and doesn't exist at runtime */
  [ItemsSym]: Item;
  /** @internal */
  static _schema: any;
  /** @internal */
  get _schema(): {
    [ItemsSym]: SchemaFor<Item> | any;
  };
  /**
   * The current account's view of this `CoFeed`
   * @category Content
   */
  get byMe(): CoFeedEntry<Item> | undefined;
  /**
   * The per-account view of this `CoFeed`
   *
   * @example
   * ```ts
   * // Access entries directly by account ID
   * const aliceEntries = feed[aliceAccount.id];
   * console.log(aliceEntries.value); // Latest value from Alice
   *
   * // Iterate through all accounts' entries
   * for (const [accountId, entries] of Object.entries(feed)) {
   *   console.log(`Latest entry from ${accountId}:`, entries.value);
   *
   *   // Access all entries from this account
   *   for (const entry of entries.all) {
   *     console.log(`Entry made at ${entry.madeAt}:`, entry.value);
   *   }
   * }
   * ```
   *
   * @category Content
   */
  get perAccount(): {
    [key: ID<Account>]: CoFeedEntry<Item>;
  };
  /**
   * The per-session view of this `CoFeed`
   * @category Content
   */
  get perSession(): {
    [key: SessionID]: CoFeedEntry<Item>;
  };
  /**
   * The current session's view of this `CoFeed`
   *
   * This is a shortcut for `this.perSession` where the session ID is the current session ID.
   *
   * @category Content
   */
  get inCurrentSession(): CoFeedEntry<Item> | undefined;
  constructor(
    options:
      | {
          init: Item[];
          owner: Account | Group;
        }
      | {
          fromRaw: RawCoStream;
        },
  );
  /**
   * Create a new `CoFeed`
   * @category Creation
   */
  static create<S extends CoFeed>(
    this: CoValueClass<S>,
    init: S extends CoFeed<infer Item> ? Item[] : never,
    options?:
      | {
          owner: Account | Group;
        }
      | Account
      | Group,
  ): S;
  getItemsDescriptor(): any;
  /**
   * Push items to this `CoFeed`
   *
   * Items are appended to the current session's log. Each session (tab, device, app instance)
   * maintains its own append-only log, which is then aggregated into the per-account view.
   *
   * @example
   * ```ts
   * // Adds items to current session's log
   * feed.push("item1", "item2");
   *
   * // View items from current session
   * console.log(feed.inCurrentSession);
   *
   * // View aggregated items from all sessions for current account
   * console.log(feed.byMe);
   * ```
   *
   * @category Content
   */
  push(...items: Item[]): void;
  private pushItem;
  /**
   * Get a JSON representation of the `CoFeed`
   * @category
   */
  toJSON(): {
    id: string;
    _type: "CoStream";
    [key: string]: unknown;
    in: {
      [key: string]: unknown;
    };
  };
  /** @internal */
  [inspect](): {
    id: string;
    _type: "CoStream";
    [key: string]: unknown;
    in: {
      [key: string]: unknown;
    };
  };
  /** @internal */
  static schema<V extends CoFeed>(
    this: {
      new (...args: any): V;
    } & typeof CoFeed,
    def: {
      [ItemsSym]: V["_schema"][ItemsSym];
    },
  ): void;
  /**
   * Load a `CoFeed`
   * @category Subscription & Loading
   */
  static load<F extends CoFeed, const R extends RefsToResolve<F> = true>(
    this: CoValueClass<F>,
    id: ID<F>,
    options: {
      resolve?: RefsToResolveStrict<F, R>;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Resolved<F, R> | null>;
  /**
   * Subscribe to a `CoFeed`, when you have an ID but don't have a `CoFeed` instance yet
   * @category Subscription & Loading
   */
  static subscribe<F extends CoFeed, const R extends RefsToResolve<F> = true>(
    this: CoValueClass<F>,
    id: ID<F>,
    listener: (value: Resolved<F, R>, unsubscribe: () => void) => void,
  ): () => void;
  static subscribe<F extends CoFeed, const R extends RefsToResolve<F> = true>(
    this: CoValueClass<F>,
    id: ID<F>,
    options: SubscribeListenerOptions<F, R>,
    listener: (value: Resolved<F, R>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * Ensure a `CoFeed` is loaded to the specified depth
   *
   * @returns A new instance of the same CoFeed that's loaded to the specified depth
   * @category Subscription & Loading
   */
  ensureLoaded<F extends CoFeed, const R extends RefsToResolve<F>>(
    this: F,
    options?: {
      resolve?: RefsToResolveStrict<F, R>;
    },
  ): Promise<Resolved<F, R>>;
  /**
   * An instance method to subscribe to an existing `CoFeed`
   *
   * No need to provide an ID or Account since they're already part of the instance.
   * @category Subscription & Loading
   */
  subscribe<F extends CoFeed, const R extends RefsToResolve<F>>(
    this: F,
    listener: (value: Resolved<F, R>, unsubscribe: () => void) => void,
  ): () => void;
  subscribe<F extends CoFeed, const R extends RefsToResolve<F>>(
    this: F,
    options: {
      resolve?: RefsToResolveStrict<F, R>;
    },
    listener: (value: Resolved<F, R>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * Wait for the `CoFeed` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: {
    timeout?: number;
  }): Promise<unknown[]>;
}
/**
 * The proxy handler for `CoFeed` instances
 * @internal
 */
export declare const CoStreamPerAccountProxyHandler: (
  innerTarget: CoFeed,
) => ProxyHandler<{}>;
/** @deprecated Use FileStream instead */
export { FileStream as BinaryCoStream };
/**
 * FileStreams are `CoFeed`s that contain binary data, collaborative versions of `Blob`s.
 *
 * @categoryDescription Declaration
 * `FileStream` can be referenced in schemas.
 *
 * ```ts
 * import { coField, FileStream } from "jazz-tools";
 *
 * class MyCoMap extends CoMap {
 *   file = coField.ref(FileStream);
 * }
 * ```
 *
 * @category CoValues
 */
export declare class FileStream extends CoValueBase implements CoValue {
  /**
   * The ID of this `FileStream`
   * @category Content
   */
  id: ID<this>;
  /** @category Type Helpers */
  _type: "BinaryCoStream";
  /** @internal */
  _raw: RawBinaryCoStream;
  constructor(
    options:
      | {
          owner: Account | Group;
        }
      | {
          fromRaw: RawBinaryCoStream;
        },
  );
  /**
   * Create a new empty `FileStream` instance.
   *
   * @param options - Configuration options for the new FileStream
   * @param options.owner - The Account or Group that will own this FileStream and control access rights
   *
   * @example
   * ```typescript
   * // Create owned by an account
   * const stream = FileStream.create({ owner: myAccount });
   *
   * // Create owned by a group
   * const stream = FileStream.create({ owner: teamGroup });
   *
   * // Create with implicit owner
   * const stream = FileStream.create(myAccount);
   * ```
   *
   * @remarks
   * For uploading an existing file or blob, use {@link FileStream.createFromBlob} instead.
   *
   * @category Creation
   */
  static create<S extends FileStream>(
    this: CoValueClass<S>,
    options?:
      | {
          owner?: Account | Group;
        }
      | Account
      | Group,
  ): S;
  getMetadata(): BinaryStreamInfo | undefined;
  getChunks(options?: {
    allowUnfinished?: boolean;
  }):
    | (BinaryStreamInfo & {
        chunks: Uint8Array[];
        finished: boolean;
      })
    | undefined;
  isBinaryStreamEnded(): boolean;
  start(options: BinaryStreamInfo): void;
  push(data: Uint8Array): void;
  end(): void;
  toBlob(options?: {
    allowUnfinished?: boolean;
  }): Blob | undefined;
  /**
   * Load a `FileStream` as a `Blob`
   *
   * @category Content
   */
  static loadAsBlob(
    id: ID<FileStream>,
    options?: {
      allowUnfinished?: boolean;
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<Blob | undefined>;
  /**
   * Create a `FileStream` from a `Blob` or `File`
   *
   * @example
   * ```ts
   * import { coField, FileStream } from "jazz-tools";
   *
   * const fileStream = await FileStream.createFromBlob(file, {owner: group})
   * ```
   * @category Content
   */
  static createFromBlob(
    blob: Blob | File,
    options?:
      | {
          owner?: Group | Account;
          onProgress?: (progress: number) => void;
        }
      | Account
      | Group,
  ): Promise<FileStream>;
  /**
   * Get a JSON representation of the `FileStream`
   * @category Content
   */
  toJSON(): {
    id: string;
    _type: "BinaryCoStream";
    mimeType?: string;
    totalSizeBytes?: number;
    fileName?: string;
    chunks?: Uint8Array[];
    finished?: boolean;
  };
  /** @internal */
  [inspect](): {
    id: string;
    _type: "BinaryCoStream";
    mimeType?: string;
    totalSizeBytes?: number;
    fileName?: string;
    chunks?: Uint8Array[];
    finished?: boolean;
  };
  /**
   * Load a `FileStream`
   * @category Subscription & Loading
   */
  static load<C extends FileStream>(
    this: CoValueClass<C>,
    id: ID<C>,
    options?: {
      loadAs?: Account | AnonymousJazzAgent;
      allowUnfinished?: boolean;
    },
  ): Promise<FileStream | null>;
  /**
   * Subscribe to a `FileStream`, when you have an ID but don't have a `FileStream` instance yet
   * @category Subscription & Loading
   */
  static subscribe<F extends FileStream, const R extends RefsToResolve<F>>(
    this: CoValueClass<F>,
    id: ID<F>,
    listener: (value: Resolved<F, R>, unsubscribe: () => void) => void,
  ): () => void;
  static subscribe<F extends FileStream, const R extends RefsToResolve<F>>(
    this: CoValueClass<F>,
    id: ID<F>,
    options: SubscribeListenerOptions<F, R>,
    listener: (value: Resolved<F, R>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * An instance method to subscribe to an existing `FileStream`
   * @category Subscription & Loading
   */
  subscribe<B extends FileStream>(
    this: B,
    listener: (value: Resolved<B, true>) => void,
  ): () => void;
  /**
   * Wait for the `FileStream` to be uploaded to the other peers.
   *
   * @category Subscription & Loading
   */
  waitForSync(options?: {
    timeout?: number;
  }): Promise<unknown[]>;
}
