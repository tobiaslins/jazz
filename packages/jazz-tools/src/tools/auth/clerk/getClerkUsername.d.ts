import type { MinimalClerkClient } from "./types.js";
export declare function getClerkUsername(
  clerkClient: Pick<MinimalClerkClient, "user">,
): string | null;
