import { KvStore } from "./KvStoreContext.js";
export declare class InMemoryKVStore implements KvStore {
  private store;
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clearAll(): Promise<void>;
}
