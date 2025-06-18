import { type InviteSecret } from "cojson";
import { Account } from "../coValues/account.js";
import type { CoValue, CoValueOrZodSchema } from "../internal.js";
/** @category Invite Links */
export declare function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin" | "writeOnly",
  baseURL: string,
  valueHint?: string,
): string;
/** @category Invite Links */
export declare function parseInviteLink(inviteURL: string):
  | {
      valueID: string;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined;
/** @category Invite Links */
export declare function consumeInviteLink<S extends CoValueOrZodSchema>({
  inviteURL,
  as,
  forValueHint,
  invitedObjectSchema,
}: {
  inviteURL: string;
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
