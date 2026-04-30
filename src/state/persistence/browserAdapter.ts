import { deleteBlobFromIdb, listIdbKeys, loadBlobFromIdb, saveBlobToIdb } from '@/state/persistence/idb';
import {
  deleteJSONFromLocalStorage,
  listLocalStorageKeys,
  loadJSONFromLocalStorage,
  saveJSONToLocalStorage,
} from '@/state/persistence/local';
import type { PersistenceAdapter } from '@/state/persistence/types';

export const browserPersistenceAdapter: PersistenceAdapter = {
  saveJSON: saveJSONToLocalStorage,
  saveBlob: saveBlobToIdb,
  loadJSON: loadJSONFromLocalStorage,
  loadBlob: loadBlobFromIdb,
  listKeys: async (prefix: string) => {
    const [jsonKeys, blobKeys] = await Promise.all([listLocalStorageKeys(prefix), listIdbKeys(prefix)]);
    return Array.from(new Set([...jsonKeys, ...blobKeys]));
  },
  deleteJSON: deleteJSONFromLocalStorage,
  deleteBlob: deleteBlobFromIdb,
};
