/**
 * In-Memory storage adapter (No local storage persistence)
 * Ensures all sessions and states remain strictly in memory with zero localStorage retention for domain data.
 */
const memoryStore = new Map<string, string>();
type StorageListener = (key: string, value: any) => void;
const listeners = new Set<StorageListener>();

// Clean up any legacy localStorage residue on initialize (except auth session if persisted)
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k !== 'rafflepro_auth_session' && k !== 'rafflepro_sidebar_collapsed') {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // Ignore sandbox or security errors
  }
}

export const storageAdapter = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = memoryStore.get(key);
      if (!item) return defaultValue;
      return JSON.parse(item) as T;
    } catch (e) {
      console.error(`Error reading key "${key}":`, e);
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      const json = JSON.stringify(value);
      memoryStore.set(key, json);
      listeners.forEach((fn) => {
        try {
          fn(key, value);
        } catch (err) {
          console.error('Storage listener error:', err);
        }
      });
      return true;
    } catch (e) {
      console.error(`Error saving key "${key}":`, e);
      return false;
    }
  },

  remove(key: string): void {
    try {
      memoryStore.delete(key);
      listeners.forEach((fn) => {
        try {
          fn(key, null);
        } catch (err) {
          console.error('Storage listener error:', err);
        }
      });
    } catch (e) {
      console.error(`Error removing key "${key}":`, e);
    }
  },

  clear(): void {
    try {
      memoryStore.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  },

  subscribe(listener: StorageListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

