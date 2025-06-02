import type { LocalNode } from "cojson";
import type { CoValue } from "../internal.js";

export function applyCoValueMigrations(instance: CoValue) {
  const node = instance._raw.core.node;

  // @ts-expect-error _migratedCoValues is a custom expando property
  const migratedCoValues = (node._migratedCoValues ??= new Set<string>());

  if (
    "migration" in instance &&
    typeof instance.migration === "function" &&
    instance._type !== "Account" &&
    !migratedCoValues.has(instance.id)
  ) {
    const result = instance.migration?.(instance);
    if (result && "then" in result) {
      console.error("Migration function cannot be async");
    }
    migratedCoValues.add(instance.id);
  }
}
