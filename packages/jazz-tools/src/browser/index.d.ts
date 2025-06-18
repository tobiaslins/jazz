import { Account, CoValue, CoValueOrZodSchema, InviteSecret } from "jazz-tools";
export { BrowserPasskeyAuth } from "./auth/PasskeyAuth.js";
export * from "./createBrowserContext.js";
export * from "./BrowserContextManager.js";
export { LocalStorageKVStore } from "./auth/LocalStorageKVStore.js";
/** @category Invite Links */
export declare function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin" | "writeOnly",
  {
    baseURL,
    valueHint,
  }?: {
    baseURL?: string;
    valueHint?: string;
  },
): string;
/** @category Invite Links */
export { parseInviteLink } from "jazz-tools";
/** @category Invite Links */
export declare function consumeInviteLinkFromWindowLocation<
  S extends CoValueOrZodSchema,
>({
  as,
  forValueHint,
  invitedObjectSchema,
}: {
  as?: Account;
  forValueHint?: string;
  invitedObjectSchema: S;
}): Promise<
  | {
      valueID: string;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined
>;
