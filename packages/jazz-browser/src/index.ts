import {
  Account,
  CoValue,
  CoValueClass,
  ID,
  InviteSecret,
  cojsonInternals,
} from "jazz-tools";
import { setupInspector } from "./utils/export-account-inspector.js";
export { AuthSecretStorage } from "./auth/AuthSecretStorage.js";
export { BrowserDemoAuth } from "./auth/DemoAuth.js";
export { BrowserPasskeyAuth } from "./auth/PasskeyAuth.js";
export { BrowserPassphraseAuth } from "./auth/PassphraseAuth.js";

setupInspector();

export * from "./createBrowserContext.js";
export * from "./BrowserContextManager.js";

/** @category Invite Links */
export function createInviteLink<C extends CoValue>(
  value: C,
  role: "reader" | "writer" | "admin" | "writeOnly",
  // default to same address as window.location, but without hash
  {
    baseURL = window.location.href.replace(/#.*$/, ""),
    valueHint,
  }: { baseURL?: string; valueHint?: string } = {},
): string {
  const coValueCore = value._raw.core;
  let currentCoValue = coValueCore;

  while (currentCoValue.header.ruleset.type === "ownedByGroup") {
    currentCoValue = currentCoValue.getGroup().core;
  }

  const { ruleset, meta } = currentCoValue.header;

  if (ruleset.type !== "group" || meta?.type === "account") {
    throw new Error("Can't create invite link for object without group");
  }

  const group = cojsonInternals.expectGroup(currentCoValue.getCurrentContent());
  const inviteSecret = group.createInvite(role);

  return `${baseURL}#/invite/${valueHint ? valueHint + "/" : ""}${
    value.id
  }/${inviteSecret}`;
}

/** @category Invite Links */
export function parseInviteLink<C extends CoValue>(
  inviteURL: string,
):
  | {
      valueID: ID<C>;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined {
  const url = new URL(inviteURL);
  const parts = url.hash.split("/");

  let valueHint: string | undefined;
  let valueID: ID<C> | undefined;
  let inviteSecret: InviteSecret | undefined;

  if (parts[0] === "#" && parts[1] === "invite") {
    if (parts.length === 5) {
      valueHint = parts[2];
      valueID = parts[3] as ID<C>;
      inviteSecret = parts[4] as InviteSecret;
    } else if (parts.length === 4) {
      valueID = parts[2] as ID<C>;
      inviteSecret = parts[3] as InviteSecret;
    }

    if (!valueID || !inviteSecret) {
      return undefined;
    }
    return { valueID, inviteSecret, valueHint };
  }
}

/** @category Invite Links */
export function consumeInviteLinkFromWindowLocation<V extends CoValue>({
  as,
  forValueHint,
  invitedObjectSchema,
}: {
  as: Account;
  forValueHint?: string;
  invitedObjectSchema: CoValueClass<V>;
}): Promise<
  | {
      valueID: ID<V>;
      valueHint?: string;
      inviteSecret: InviteSecret;
    }
  | undefined
> {
  return new Promise((resolve, reject) => {
    const result = parseInviteLink<V>(window.location.href);

    if (result && result.valueHint === forValueHint) {
      as.acceptInvite(result.valueID, result.inviteSecret, invitedObjectSchema)
        .then(() => {
          resolve(result);
          window.history.replaceState(
            {},
            "",
            window.location.href.replace(/#.*$/, ""),
          );
        })
        .catch(reject);
    } else {
      resolve(undefined);
    }
  });
}
