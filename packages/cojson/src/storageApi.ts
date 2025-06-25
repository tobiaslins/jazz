import type { CoValueKnownState, NewContentMessage } from "./sync.js";

export interface StorageAPI {
  load(
    id: string,
    callback: (data: NewContentMessage) => void,
    done?: (found: boolean) => void,
  ): void;
  store(
    id: string,
    data: NewContentMessage[] | undefined,
    handleCorrection: (correction: CoValueKnownState) => void,
  ): void;

  getKnownState(id: string): CoValueKnownState;
}
