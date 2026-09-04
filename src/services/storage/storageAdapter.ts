/**
 * Safe local storage utility with memory fallback for tests and SSR
 */
const memoryStore = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

export const storageAdapter = {
  get<T>(key: string, defaultValue: T): T {
    try {
      if (isLocalStorageAvailable()) {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
      } else {
        const item = memoryStore.get(key);
        if (!item) return defaultValue;
        return JSON.parse(item) as T;
      }
    } catch (e) {
      console.error(`Error reading key "${key}":`, e);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      const json = JSON.stringify(value);
      if (isLocalStorageAvailable()) {
        localStorage.setItem(key, json);
      } else {
        memoryStore.set(key, json);
      }
      return true;
    } catch (e) {
      console.error(`Error saving key "${key}":`, e);
      return false;
    }
  },

  remove(key: string): void {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.removeItem(key);
      } else {
        memoryStore.delete(key);
      }
    } catch (e) {
      console.error(`Error removing key "${key}":`, e);
    }
  },

  clear(): void {
    try {
      if (isLocalStorageAvailable()) {
        localStorage.clear();
      }
      memoryStore.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  },
};
