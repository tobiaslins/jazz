import { type OpID, type RawCoPlainText } from "cojson";
import {
  AnonymousJazzAgent,
  CoValue,
  CoValueClass,
  ID,
  Resolved,
  SubscribeListenerOptions,
} from "../internal.js";
import { inspect } from "../internal.js";
import { Account } from "./account.js";
import { Group } from "./group.js";
export type TextPos = OpID;
export declare class CoPlainText extends String implements CoValue {
  id: ID<this>;
  _type: "CoPlainText";
  _raw: RawCoPlainText;
  get _owner(): Account | Group;
  get _loadedAs(): Account | AnonymousJazzAgent;
  /** @internal */
  constructor(
    options:
      | {
          fromRaw: RawCoPlainText;
        }
      | {
          text: string;
          owner: Account | Group;
        }
      | undefined,
  );
  /**
   * Create a new `CoPlainText` with the given text and owner.
   *
   * The owner (a Group or Account) determines access rights to the CoPlainText.
   *
   * The CoPlainText will immediately be persisted and synced to connected peers.
   *
   * @example
   * ```ts
   * const text = CoPlainText.create("Hello, world!", { owner: me });
   * ```
   *
   * @category Creation
   */
  static create<T extends CoPlainText>(
    this: CoValueClass<T>,
    text: string,
    options?:
      | {
          owner: Account | Group;
        }
      | Account
      | Group,
  ): T;
  get length(): number;
  toString(): string;
  valueOf(): string;
  toJSON(): string;
  [inspect](): string;
  insertBefore(idx: number, text: string): void;
  insertAfter(idx: number, text: string): void;
  deleteRange(range: {
    from: number;
    to: number;
  }): void;
  posBefore(idx: number): TextPos | undefined;
  posAfter(idx: number): TextPos | undefined;
  idxBefore(pos: TextPos): number | undefined;
  idxAfter(pos: TextPos): number | undefined;
  static fromRaw<V extends CoPlainText>(
    this: CoValueClass<V> & typeof CoPlainText,
    raw: RawCoPlainText,
  ): V & CoPlainText;
  /**
   * Apply text, modifying the text in place. Calculates the diff and applies it to the CoValue.
   *
   * @category Mutation
   */
  applyDiff(other: string): void;
  /**
   * Load a `CoPlainText` with a given ID, as a given account.
   *
   * @category Subscription & Loading
   */
  static load<T extends CoPlainText>(
    this: CoValueClass<T>,
    id: ID<T>,
    options?: {
      loadAs?: Account | AnonymousJazzAgent;
    },
  ): Promise<T | null>;
  /**
   * Load and subscribe to a `CoPlainText` with a given ID, as a given account.
   *
   * Automatically also subscribes to updates to all referenced/nested CoValues as soon as they are accessed in the listener.
   *
   * Check out the `load` methods on `CoMap`/`CoList`/`CoStream`/`Group`/`Account` to see which depth structures are valid to nest.
   *
   * Returns an unsubscribe function that you should call when you no longer need updates.
   *
   * Also see the `useCoState` hook to reactively subscribe to a CoValue in a React component.
   *
   * @category Subscription & Loading
   */
  static subscribe<T extends CoPlainText>(
    this: CoValueClass<T>,
    id: ID<T>,
    listener: (value: Resolved<T, true>, unsubscribe: () => void) => void,
  ): () => void;
  static subscribe<T extends CoPlainText>(
    this: CoValueClass<T>,
    id: ID<T>,
    options: Omit<SubscribeListenerOptions<T, true>, "resolve">,
    listener: (value: Resolved<T, true>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * Given an already loaded `CoPlainText`, subscribe to updates to the `CoPlainText` and ensure that the specified fields are loaded to the specified depth.
   *
   * Works like `CoPlainText.subscribe()`, but you don't need to pass the ID or the account to load as again.
   *
   * Returns an unsubscribe function that you should call when you no longer need updates.
   *
   * @category Subscription & Loading
   **/
  subscribe<T extends CoPlainText>(
    this: T,
    listener: (value: Resolved<T, true>, unsubscribe: () => void) => void,
  ): () => void;
  /**
   * Allow CoPlainText to behave like a primitive string in most contexts (e.g.,
   * string concatenation, template literals, React rendering, etc.) by implementing
   * Symbol.toPrimitive. This eliminates the need to call .toString() explicitly.
   *
   * The 'hint' parameter indicates the preferred type of conversion:
   * - 'string': prefer string conversion
   * - 'number': prefer number conversion (attempt to parse the text as a number)
   * - 'default': usually treat as string
   */
  [Symbol.toPrimitive](hint: string): string | number;
}
