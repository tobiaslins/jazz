import type { CoValue, LoadedAndRequired, MaybeLoaded } from "../internal.js";

export function isCoValueId(id: unknown): id is `co_z${string}` {
  return typeof id === "string" && id.startsWith("co_z");
}

/**
 * Assert that a CoValue is loaded, otherwise throw an error
 */
export function assertLoaded<T extends MaybeLoaded<CoValue>>(
  coValue: T,
): asserts coValue is LoadedAndRequired<T> {
  if (!coValue.$isLoaded) {
    throw new Error("CoValue is not loaded");
  }
}
