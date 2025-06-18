import { KvStore } from "jazz-tools";
export declare class LocalStorageKVStore implements KvStore {
  constructor();
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clearAll(): Promise<void>;
}
