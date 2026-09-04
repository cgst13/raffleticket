import { Expense } from '../../types/expense';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';

export interface ExpenseFilter {
  raffleId?: string;
  category?: string;
  search?: string;
}

export class LocalStorageExpensesRepository {
  getAll(filter?: ExpenseFilter): Expense[] {
    let list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    if (!filter) return list;

    if (filter.raffleId) {
      list = list.filter((e) => e.raffleId === filter.raffleId);
    }

    if (filter.category && filter.category !== 'all') {
      list = list.filter((e) => e.category === filter.category);
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.receiptNumber && e.receiptNumber.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getById(id: string): Expense | null {
    const list = this.getAll();
    return list.find((e) => e.id === id) || null;
  }

  create(expense: Expense): Expense {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    list.unshift(expense);
    storageAdapter.set(STORAGE_KEYS.EXPENSES, list);
    return expense;
  }

  update(id: string, updates: Partial<Expense>): Expense | null {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storageAdapter.set(STORAGE_KEYS.EXPENSES, list);
    return list[index];
  }

  delete(id: string): boolean {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const filtered = list.filter((e) => e.id !== id);
    if (filtered.length === list.length) return false;
    storageAdapter.set(STORAGE_KEYS.EXPENSES, filtered);
    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const filtered = list.filter((e) => e.raffleId !== raffleId);
    const deletedCount = list.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.EXPENSES, filtered);
    return deletedCount;
  }
}

export const expensesRepository = new LocalStorageExpensesRepository();
