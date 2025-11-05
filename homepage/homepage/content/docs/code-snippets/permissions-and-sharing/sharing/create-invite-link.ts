//[!code hide]
import { Organization } from "./schema.ts";
//[!code hide]
import { createJazzTestAccount } from "jazz-tools/testing";
const me = await createJazzTestAccount({
  isCurrentActiveAccount: true,
});
const organization = Organization.create({ name: "Garden Computing" });

// #region CreateLink
import { createInviteLink } from "jazz-tools";

const inviteLink = createInviteLink(
  organization,
  "writer",
  "https://example.com/", // Base URL for the invite link
);
// #endregion

// #region ConsumeLink
import { consumeInviteLink } from "jazz-tools";

consumeInviteLink({
  inviteURL: inviteLink,
  invitedObjectSchema: Organization, // Pass the schema for the invited object
});
// #endregion
