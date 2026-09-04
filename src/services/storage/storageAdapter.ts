/**
 * In-Memory storage adapter (No local storage persistence)
 * Ensures all sessions and states remain strictly in memory with zero localStorage retention.
 */
const memoryStore = new Map<string, string>();

// Clean up legacy data residue on initialize, while preserving persistent session
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const legacyKeys = [
      'rafflepro_raffles',
      'rafflepro_designs',
      'rafflepro_print_layouts',
      'rafflepro_print_sets',
      'rafflepro_booklets',
      'rafflepro_tickets',
      'rafflepro_expenses',
      'rafflepro_activities',
      'rafflepro_settings',
      'rafflepro_users',
    ];
    legacyKeys.forEach((k) => localStorage.removeItem(k));
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
      return true;
    } catch (e) {
      console.error(`Error saving key "${key}":`, e);
      return false;
    }
  },

  remove(key: string): void {
    try {
      memoryStore.delete(key);
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
};
