import {
  AvailableCoValueCore,
  CoValueCore,
} from "./coValueCore/coValueCore.js";
import { VerifiedState } from "./coValueCore/verifiedState.js";
import { RawCoID } from "./ids.js";
import { LocalNode } from "./localNode.js";

export class CoValuesStore {
  node: LocalNode;
  coValues = new Map<RawCoID, CoValueCore>();

  constructor(node: LocalNode) {
    this.node = node;
  }

  get(id: RawCoID) {
    let entry = this.coValues.get(id);

    if (!entry) {
      entry = CoValueCore.fromID(id, this.node);
      this.coValues.set(id, entry);
    }

    return entry;
  }

  internalMarkMagicallyAvailable(
    id: RawCoID,
    verified: VerifiedState,
    { forceOverwrite = false }: { forceOverwrite?: boolean } = {},
  ): AvailableCoValueCore {
    const entry = this.get(id);
    entry.internalMarkMagicallyAvailable(verified, { forceOverwrite });
    return entry as AvailableCoValueCore;
  }

  getEntries() {
    return this.coValues.entries();
  }

  getValues() {
    return this.coValues.values();
  }

  getKeys() {
    return this.coValues.keys();
  }
}
