function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) {
    return false;
  }
  return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

export async function saveJSONToLocalStorage(key: string, payload: unknown): Promise<void> {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (error) {
    if (isQuotaError(error)) {
      throw error;
    }
    throw new Error(`Failed to save localStorage key "${key}"`, { cause: error });
  }
}

export async function loadJSONFromLocalStorage<T>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`Failed to parse localStorage key "${key}"`, error);
    return null;
  }
}

export async function listLocalStorageKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) {
      continue;
    }
    if (key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  return keys;
}

export async function deleteJSONFromLocalStorage(key: string): Promise<void> {
  localStorage.removeItem(key);
}
