import { AvailableCoValueCore } from "./coValueCore/coValueCore.js";
import { VerifiedState } from "./coValueCore/verifiedState.js";
import { CoValueState } from "./coValueState.js";
import { RawCoID } from "./ids.js";
import { LocalNode } from "./localNode.js";
import { PeerID } from "./sync.js";

export class CoValuesStore {
  node: LocalNode;
  coValues = new Map<RawCoID, CoValueState>();

  constructor(node: LocalNode) {
    this.node = node;
  }

  get(id: RawCoID) {
    let entry = this.coValues.get(id);

    if (!entry) {
      entry = new CoValueState(id, this.node);
      this.coValues.set(id, entry);
    }

    return entry;
  }

  internalMarkMagicallyAvailable(
    id: RawCoID,
    verified: VerifiedState,
    { forceOverwrite = false }: { forceOverwrite?: boolean } = {},
  ): CoValueState & { core: AvailableCoValueCore } {
    const entry = this.get(id);
    entry.internalMarkMagicallyAvailable(verified, { forceOverwrite });
    return entry as CoValueState & { core: AvailableCoValueCore };
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
