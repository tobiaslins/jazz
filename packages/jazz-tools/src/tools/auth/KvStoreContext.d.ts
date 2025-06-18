export interface KvStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clearAll(): Promise<void>;
}
export declare class KvStoreContext {
  private static instance;
  private storageInstance;
  private constructor();
  static getInstance(): KvStoreContext;
  isInitialized(): boolean;
  initialize(store: KvStore): void;
  getStorage(): KvStore;
}
export default KvStoreContext;
