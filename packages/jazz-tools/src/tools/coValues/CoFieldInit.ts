import { CoFeed } from "./coFeed";
import { CoList } from "./coList";
import { CoMap, CoMapInit } from "./coMap";
import { CoPlainText } from "./coPlainText";
import { CoRichText } from "./coRichText";
import { CoValue } from "./interfaces";

/**
 * Returns the type of values that can be used to initialize a field of the provided type.
 *
 * For CoValue references, either a CoValue of the same type, or a plain JSON value that can be
 * converted to the CoValue type are allowed.
 */
export type CoFieldInit<V> =
  | V
  | (V extends CoValue
      ? V extends CoMap
        ? CoMapInit<V>
        : V extends CoList<infer T> | CoFeed<infer T>
          ? ReadonlyArray<CoFieldInit<T>>
          : V extends CoPlainText | CoRichText
            ? string
            : never
      : never);
