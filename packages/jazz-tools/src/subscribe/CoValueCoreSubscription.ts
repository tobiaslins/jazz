import { LocalNode, RawCoMap, RawCoValue } from "cojson";
import { CoValueState } from "cojson/dist/coValueState.js";

export class CoValueCoreSubscription {
  _unsubscribe: () => void = () => {};
  unsubscribed = false;

  value: RawCoMap | undefined;

  constructor(
    public node: LocalNode,
    public id: string,
    public listener: (value: RawCoValue | "unavailable") => void,
  ) {
    const entry = this.node.coValuesStore.get(this.id as any);

    if (entry?.core) {
      this.subscribe(entry.core.getCurrentContent());
    } else {
      this.node.loadCoValueCore(this.id as any).then((value) => {
        if (this.unsubscribed) return;

        if (value !== "unavailable") {
          this.subscribe(value.getCurrentContent());
        } else {
          this.listener("unavailable");
          this.subscribeToState();
        }
      });
    }
  }

  subscribeToState() {
    const entry = this.node.coValuesStore.get(this.id as any);
    const handleStateChange = (entry: CoValueState) => {
      if (this.unsubscribed) {
        entry.removeListener(handleStateChange);
        return;
      }

      if (entry.core) {
        const core = entry.core;

        this.subscribe(core.getCurrentContent());
        entry.removeListener(handleStateChange);
      }
    };

    entry.addListener(handleStateChange);

    this._unsubscribe = () => {
      entry.removeListener(handleStateChange);
    };
  }

  subscribe(value: RawCoValue) {
    if (this.unsubscribed) return;

    this._unsubscribe = value.subscribe((value) => {
      this.listener(value);
    });

    this.listener(value);
  }

  unsubscribe() {
    if (this.unsubscribed) return;
    this.unsubscribed = true;
    this._unsubscribe();
  }
}
