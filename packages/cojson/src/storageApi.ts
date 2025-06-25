import type {
  CoValueKnownState,
  KnownStateMessage,
  NewContentMessage,
} from "./sync.js";

export interface StorageAPI {
  load(
    id: string,
    callback: (data: NewContentMessage | KnownStateMessage) => void,
    done?: (found: boolean) => void,
  ): void;
  store(
    data: NewContentMessage[] | undefined,
    handleCorrection: (correction: CoValueKnownState) => void,
  ): void;

  getKnownState(id: string): CoValueKnownState;
}
