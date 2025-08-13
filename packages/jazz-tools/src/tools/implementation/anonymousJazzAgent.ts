import { LocalNode } from "cojson";

export class AnonymousJazzAgent {
  $type = "Anonymous" as const;
  constructor(public node: LocalNode) {}
}
