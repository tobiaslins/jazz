import type { Account, CoMap, Group } from "../internal.js";
/**
 * Regisering schemas into this Record to avoid circular dependencies.
 */
export declare const RegisteredSchemas: {
  Account: typeof Account;
  Group: typeof Group;
  CoMap: typeof CoMap;
};
