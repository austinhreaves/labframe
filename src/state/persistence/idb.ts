import { del, get, keys, set } from 'idb-keyval';

export async function saveBlobToIdb(key: string, blob: Blob): Promise<void> {
  await set(key, blob);
}

export async function loadBlobFromIdb(key: string): Promise<Blob | null> {
  const value = await get(key);
  if (!(value instanceof Blob)) {
    return null;
  }
  return value;
}

export async function listIdbKeys(prefix: string): Promise<string[]> {
  const allKeys = await keys();
  return allKeys.filter((key): key is string => typeof key === 'string' && key.startsWith(prefix));
}

export async function deleteBlobFromIdb(key: string): Promise<void> {
  await del(key);
}
