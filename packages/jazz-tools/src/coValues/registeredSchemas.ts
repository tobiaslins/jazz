import type {
  Account,
  AccountClass,
  AnyAccountSchema,
  CoMap,
  CoValueFromRaw,
  Group,
} from "../internal.js";

/**
 * Regisering schemas into this Record to avoid circular dependencies.
 */
export const RegisteredSchemas = {} as {
  Account: (AccountClass<Account> & CoValueFromRaw<Account>) | AnyAccountSchema;
  Group: typeof Group;
  CoMap: typeof CoMap;
};
