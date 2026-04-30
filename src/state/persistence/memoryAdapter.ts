import type { PersistenceAdapter } from '@/state/persistence/types';

export function createMemoryPersistenceAdapter(): PersistenceAdapter {
  const jsonStore = new Map<string, unknown>();
  const blobStore = new Map<string, Blob>();

  return {
    async saveJSON(key: string, payload: unknown) {
      jsonStore.set(key, payload);
    },
    async saveBlob(key: string, blob: Blob) {
      blobStore.set(key, blob);
    },
    async loadJSON<T>(key: string) {
      const value = jsonStore.get(key);
      if (value === undefined) {
        return null;
      }
      return value as T;
    },
    async loadBlob(key: string) {
      return blobStore.get(key) ?? null;
    },
    async listKeys(prefix: string) {
      const jsonKeys = [...jsonStore.keys()].filter((key) => key.startsWith(prefix));
      const blobKeys = [...blobStore.keys()].filter((key) => key.startsWith(prefix));
      return Array.from(new Set([...jsonKeys, ...blobKeys]));
    },
    async deleteJSON(key: string) {
      jsonStore.delete(key);
    },
    async deleteBlob(key: string) {
      blobStore.delete(key);
    },
  };
}
