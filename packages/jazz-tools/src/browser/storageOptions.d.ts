type StorageOption = "indexedDB";
type CombinedStorageOption = ["indexedDB"];
export type StorageConfig =
  | StorageOption
  | CombinedStorageOption
  | [StorageOption];
export declare function getStorageOptions(storage?: StorageConfig): {
  useIndexedDB: boolean;
};
export {};
