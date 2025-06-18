import { LocalNode, RawCoMap, RawCoValue } from "cojson";
export declare class CoValueCoreSubscription {
  node: LocalNode;
  id: string;
  listener: (value: RawCoValue | "unavailable") => void;
  _unsubscribe: () => void;
  unsubscribed: boolean;
  value: RawCoMap | undefined;
  constructor(
    node: LocalNode,
    id: string,
    listener: (value: RawCoValue | "unavailable") => void,
  );
  subscribeToState(): void;
  subscribe(value: RawCoValue): void;
  unsubscribe(): void;
}
